import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import pg from "pg";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { startReminderScheduler } from "./reminder-scheduler";
import { WebhookHandlers } from "./webhookHandlers";
import { getStripeSync } from "./stripeClient";

async function ensureSchemaPatches() {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS note text`);
    await pool.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS meeting_link text`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_url text`);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'message'`);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS meeting_link text`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_appointments (
        id serial PRIMARY KEY,
        client_id integer NOT NULL REFERENCES clients(id),
        broker_user_id text NOT NULL,
        meeting_date text NOT NULL,
        meeting_time text NOT NULL,
        remind_at timestamp,
        reminder_sent boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at timestamp`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan text`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS growth_band integer`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reward_credits integer NOT NULL DEFAULT 0`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stripe_processed_sessions (
        session_id text PRIMARY KEY,
        credits_granted integer NOT NULL,
        user_id text NOT NULL,
        processed_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS engagement_events (
        id serial PRIMARY KEY,
        client_id integer NOT NULL REFERENCES clients(id),
        event_type text NOT NULL,
        metadata jsonb,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS engagement_events_client_created_idx ON engagement_events(client_id, created_at DESC)`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_clicks (
        id serial PRIMARY KEY,
        client_id integer REFERENCES clients(id),
        broker_user_id text REFERENCES users(id),
        deal_id text NOT NULL,
        sid text NOT NULL,
        user_agent text,
        referer text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'marketplace_clicks'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name = 'marketplace_clicks_broker_user_id_fkey'
        ) THEN
          BEGIN
            ALTER TABLE marketplace_clicks
              ADD CONSTRAINT marketplace_clicks_broker_user_id_fkey
              FOREIGN KEY (broker_user_id) REFERENCES users(id);
          EXCEPTION WHEN others THEN NULL;
          END;
        END IF;
      END$$;
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketplace_clicks_deal_created_idx ON marketplace_clicks(deal_id, created_at DESC)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS affiliate_deals (
        id text PRIMARY KEY,
        store_name text NOT NULL,
        category text NOT NULL,
        tab text NOT NULL,
        icon_key text NOT NULL DEFAULT 'ShoppingBag',
        logo_url text NOT NULL DEFAULT '',
        logo_fallback text NOT NULL DEFAULT '🛍️',
        deal_title text NOT NULL,
        deal_description text NOT NULL,
        discount_code text,
        cashback_rate text NOT NULL DEFAULT '',
        expiry_date text NOT NULL DEFAULT '',
        accent_color text NOT NULL DEFAULT '#44ba84',
        accent_bg text NOT NULL DEFAULT 'rgba(68,186,132,0.08)',
        tracking_url text NOT NULL,
        status text NOT NULL DEFAULT 'active',
        sort_order integer NOT NULL DEFAULT 0,
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS affiliate_deals_tab_sort_idx ON affiliate_deals(tab, sort_order)`);

    const dealCountRes = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM affiliate_deals`);
    if (Number(dealCountRes.rows[0]?.count || 0) === 0) {
      const seedDeals = [
        { id: "ikea", storeName: "IKEA", category: "Home Furnishing", tab: "homeware", iconKey: "ShoppingBag", logoUrl: "https://logo.clearbit.com/ikea.com", logoFallback: "🏠", dealTitle: "Earn cashback on furniture & homeware", dealDescription: "Furnish your new home with stylish, affordable furniture and get money back on every order.", cashbackRate: "3% cashback", expiryDate: "2026-06-30", accentColor: "#0058A3", accentBg: "rgba(0,88,163,0.08)", trackingUrl: "https://www.ikea.com/gb/en/", sortOrder: 10 },
        { id: "bandq", storeName: "B&Q", category: "DIY & Garden", tab: "homeware", iconKey: "ShoppingBag", logoUrl: "https://logo.clearbit.com/diy.com", logoFallback: "🔨", dealTitle: "Earn cashback on DIY & garden essentials", dealDescription: "Everything you need for DIY and home improvement. Paint, tools, garden & more — with cashback on every order.", cashbackRate: "2.5% cashback", expiryDate: "2026-05-31", accentColor: "#F27623", accentBg: "rgba(242,118,35,0.08)", trackingUrl: "https://www.diy.com/", sortOrder: 20 },
        { id: "dunelm", storeName: "Dunelm", category: "Home Styling", tab: "homeware", iconKey: "Sparkles", logoUrl: "https://logo.clearbit.com/dunelm.com", logoFallback: "💡", dealTitle: "Earn cashback on lighting & home accessories", dealDescription: "Transform your space with beautiful lighting, curtains, bedding and accessories — and get cashback back to your account.", cashbackRate: "4% cashback", expiryDate: "2026-07-15", accentColor: "#1D3C6E", accentBg: "rgba(29,60,110,0.08)", trackingUrl: "https://www.dunelm.com/", sortOrder: 30 },
        { id: "screwfix", storeName: "Screwfix", category: "Home Maintenance", tab: "homeware", iconKey: "Truck", logoUrl: "https://logo.clearbit.com/screwfix.com", logoFallback: "🔧", dealTitle: "Earn cashback on tools & home maintenance", dealDescription: "Quality tools, electrical, plumbing and home maintenance essentials delivered to your door — with cashback on every order.", cashbackRate: "2% cashback", expiryDate: "2026-08-31", accentColor: "#E31837", accentBg: "rgba(227,24,55,0.08)", trackingUrl: "https://www.screwfix.com/", sortOrder: 40 },
        { id: "johnlewis", storeName: "John Lewis", category: "Premium Home", tab: "homeware", iconKey: "Sofa", logoUrl: "https://logo.clearbit.com/johnlewis.com", logoFallback: "🛋️", dealTitle: "Earn cashback on premium homeware", dealDescription: "Premium furniture, appliances, and home décor. Quality that lasts with a trusted warranty — and cashback on every spend.", cashbackRate: "5% cashback", expiryDate: "2026-09-30", accentColor: "#1A3A2A", accentBg: "rgba(26,58,42,0.08)", trackingUrl: "https://www.johnlewis.com/", sortOrder: 50 },
        { id: "wayfair", storeName: "Wayfair", category: "Furniture", tab: "homeware", iconKey: "Home", logoUrl: "https://logo.clearbit.com/wayfair.co.uk", logoFallback: "🪑", dealTitle: "Earn cashback on furniture & décor", dealDescription: "Thousands of furniture, lighting and home décor items at great prices — with cashback returned to your Uprosper account.", cashbackRate: "6% cashback", expiryDate: "2026-08-15", accentColor: "#7B2D8E", accentBg: "rgba(123,45,142,0.08)", trackingUrl: "https://www.wayfair.co.uk/", sortOrder: 60 },
        { id: "travelup", storeName: "Travel Up", category: "Flights & Holidays", tab: "leisure", iconKey: "Plane", logoUrl: "https://logo.clearbit.com/travelup.com", logoFallback: "✈️", dealTitle: "Earn cashback on flights & holidays", dealDescription: "Book flights, hotels and city breaks with one of the UK's most trusted travel agents — cashback returned to your Uprosper account.", cashbackRate: "1.5% cashback", expiryDate: "2026-12-31", accentColor: "#0A66C2", accentBg: "rgba(10,102,194,0.08)", trackingUrl: "https://www.anrdoezrs.net/click-101730962-16983115", sortOrder: 70 },
        { id: "booking", storeName: "Booking.com", category: "Hotels & Stays", tab: "leisure", iconKey: "Hotel", logoUrl: "https://logo.clearbit.com/booking.com", logoFallback: "🏨", dealTitle: "Earn cashback on hotels & stays worldwide", dealDescription: "Find and book hotels, apartments and unique stays in over 220 countries — with cashback returned to your account.", cashbackRate: "2% cashback", expiryDate: "2026-12-31", accentColor: "#003580", accentBg: "rgba(0,53,128,0.08)", trackingUrl: "https://www.booking.com/", sortOrder: 80 },
        { id: "virginholidays", storeName: "Virgin Holidays", category: "Cruises & Packages", tab: "leisure", iconKey: "Ship", logoUrl: "https://logo.clearbit.com/virginholidays.co.uk", logoFallback: "🚢", dealTitle: "Earn cashback on package holidays & cruises", dealDescription: "All-inclusive holidays, luxury cruises and family adventures from a brand you trust — with cashback on every booking.", cashbackRate: "2.5% cashback", expiryDate: "2026-12-31", accentColor: "#E10A0A", accentBg: "rgba(225,10,10,0.08)", trackingUrl: "https://www.virginholidays.co.uk/", sortOrder: 90 },
      ];
      for (const d of seedDeals) {
        await pool.query(
          `INSERT INTO affiliate_deals (id, store_name, category, tab, icon_key, logo_url, logo_fallback, deal_title, deal_description, cashback_rate, expiry_date, accent_color, accent_bg, tracking_url, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
          [d.id, d.storeName, d.category, d.tab, d.iconKey, d.logoUrl, d.logoFallback, d.dealTitle, d.dealDescription, d.cashbackRate, d.expiryDate, d.accentColor, d.accentBg, d.trackingUrl, d.sortOrder],
        );
      }
      console.log(`[Schema] Seeded ${seedDeals.length} affiliate deals`);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id serial PRIMARY KEY,
        month varchar(7) NOT NULL,
        title text NOT NULL,
        points integer NOT NULL DEFAULT 10,
        sort_order integer NOT NULL DEFAULT 0
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS checklist_items_month_idx ON checklist_items(month, sort_order)`);
    await pool.query(`ALTER TABLE checklist_items ALTER COLUMN month TYPE varchar(20)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS checklist_completions (
        id serial PRIMARY KEY,
        client_id integer NOT NULL REFERENCES clients(id),
        item_id integer NOT NULL REFERENCES checklist_items(id),
        completed_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(client_id, item_id)
      )
    `);

    // Seed May 2026 checklist items (idempotent)
    const mayCount = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM checklist_items WHERE month = '2026-05'`);
    if (Number(mayCount.rows[0]?.count || 0) === 0) {
      const mayItems = [
        { title: "Test smoke and carbon monoxide detectors",     points: 5,  sort_order: 10 },
        { title: "Clean kitchen extractor fan filter",           points: 5,  sort_order: 20 },
        { title: "Check all external door and window locks",     points: 10, sort_order: 30 },
        { title: "Inspect roof tiles and clear gutters",         points: 15, sort_order: 40 },
        { title: "Bleed radiators and check boiler pressure",    points: 25, sort_order: 50 },
      ];
      for (const item of mayItems) {
        await pool.query(
          `INSERT INTO checklist_items (month, title, points, sort_order) VALUES ('2026-05', $1, $2, $3)`,
          [item.title, item.points, item.sort_order],
        );
      }
      console.log("[Schema] Seeded May 2026 checklist items");
    }

    // Seed New Homeowner onboarding checklist (idempotent)
    const onboardingCount = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM checklist_items WHERE month = 'onboarding'`);
    if (Number(onboardingCount.rows[0]?.count || 0) === 0) {
      const onboardingItems = [
        { title: "Register for council tax at your new address",          points: 40, sort_order: 10 },
        { title: "Set up buildings & contents insurance",                 points: 60, sort_order: 20 },
        { title: "Connect gas, electricity & water accounts",             points: 40, sort_order: 30 },
        { title: "Set up a standing order for your mortgage payment",     points: 50, sort_order: 40 },
        { title: "Redirect your post from your previous address",         points: 20, sort_order: 50 },
        { title: "Update your address with DVLA & electoral roll",        points: 25, sort_order: 60 },
        { title: "Register with a local GP & dentist",                    points: 15, sort_order: 70 },
      ]; // total: 250pts = £2.50 at 100pts/£1
      for (const item of onboardingItems) {
        await pool.query(
          `INSERT INTO checklist_items (month, title, points, sort_order) VALUES ('onboarding', $1, $2, $3)`,
          [item.title, item.points, item.sort_order],
        );
      }
      console.log("[Schema] Seeded New Homeowner onboarding checklist");
    }

    // Gift card tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id serial PRIMARY KEY,
        brand_key varchar(50) NOT NULL,
        brand_label varchar(100) NOT NULL,
        face_value decimal(8,2) NOT NULL,
        points_cost integer NOT NULL,
        code text NOT NULL,
        pin varchar(50),
        redeemed_by_client_id integer REFERENCES clients(id),
        redeemed_at timestamp,
        uploaded_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS gift_cards_brand_avail_idx ON gift_cards(brand_key) WHERE redeemed_by_client_id IS NULL`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gift_card_brands (
        brand_key varchar(50) PRIMARY KEY,
        brand_label varchar(100) NOT NULL,
        face_value decimal(8,2) NOT NULL,
        points_cost integer NOT NULL,
        enabled boolean NOT NULL DEFAULT true
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS point_redemptions (
        id serial PRIMARY KEY,
        client_id integer NOT NULL REFERENCES clients(id),
        gift_card_id integer NOT NULL REFERENCES gift_cards(id),
        points_spent integer NOT NULL,
        redeemed_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // Prize draw tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prize_draws (
        id serial PRIMARY KEY,
        title text NOT NULL,
        description text,
        prize text NOT NULL,
        points_per_entry integer NOT NULL,
        max_entries_per_client integer,
        draw_date timestamp,
        status text NOT NULL DEFAULT 'active',
        winner_entry_id integer,
        winner_notified boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prize_draw_entries (
        id serial PRIMARY KEY,
        draw_id integer NOT NULL REFERENCES prize_draws(id),
        client_id integer NOT NULL REFERENCES clients(id),
        num_entries integer NOT NULL DEFAULT 1,
        points_spent integer NOT NULL,
        entered_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS prize_draw_entries_draw_client_idx ON prize_draw_entries(draw_id, client_id)`);

    // Charity tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS charities (
        id serial PRIMARY KEY,
        name text NOT NULL,
        description text,
        logo_url text,
        points_per_pound integer NOT NULL DEFAULT 100,
        status text NOT NULL DEFAULT 'active',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS charity_donations (
        id serial PRIMARY KEY,
        charity_id integer NOT NULL REFERENCES charities(id),
        client_id integer NOT NULL REFERENCES clients(id),
        points_donated integer NOT NULL,
        pound_value decimal(8,2) NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        donated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS charity_donations_charity_idx ON charity_donations(charity_id, donated_at DESC)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS broker_sent_rewards (
        id serial PRIMARY KEY,
        broker_user_id text NOT NULL,
        client_id integer NOT NULL REFERENCES clients(id),
        brand text NOT NULL,
        value_gbp decimal(8,2) NOT NULL DEFAULT 5.00,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS broker_sent_rewards_broker_idx ON broker_sent_rewards(broker_user_id, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS broker_sent_rewards_client_idx ON broker_sent_rewards(client_id, created_at DESC)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_reassignment_log (
        id serial PRIMARY KEY,
        company_id integer NOT NULL,
        client_id integer NOT NULL REFERENCES clients(id),
        client_name text NOT NULL,
        from_broker_user_id text NOT NULL,
        from_broker_name text NOT NULL,
        to_broker_user_id text NOT NULL,
        to_broker_name text NOT NULL,
        reassigned_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS reassignment_log_company_idx ON client_reassignment_log(company_id, reassigned_at DESC)`);

    console.log("[Schema] Idempotent column patches applied");
  } catch (err) {
    console.error("[Schema] Failed to apply schema patches:", err);
  } finally {
    await pool.end();
  }
}

const app = express();
const httpServer = createServer(app);

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Robots-Tag", "index, follow");
  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

// Stripe webhook MUST be registered BEFORE express.json() so the raw Buffer
// is preserved for signature verification.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error("[stripe webhook] req.body is not a Buffer — express.json() ran first?");
        return res.status(500).json({ error: "Webhook processing error" });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("[stripe webhook] error:", err?.message || err);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Trust proxy for production (Replit runs behind a reverse proxy)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be configured in the environment before starting the server");
}

const PgStore = connectPgSimple(session);
app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed admin user if it doesn't exist
  try {
    const { pool } = await import("./storage");
    await pool.query("ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP");
  } catch (e) {
    log(`Migration check: ${e}`);
  }

  try {
    const existingAdmin = await storage.getUserByEmail("admin@uprosper.com");
    if (!existingAdmin) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        log("Admin seeding skipped: ADMIN_PASSWORD is not configured");
      } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await storage.createUser({
          email: "admin@uprosper.com",
          password: hashedPassword,
          name: "Uprosper Admin",
          dateOfBirth: "1990-01-01",
          role: "admin",
        });
        log("Admin user created: admin@uprosper.com");
      }
    }
  } catch (error) {
    log(`Admin seeding skipped or failed: ${error}`);
  }

  await ensureSchemaPatches();

  // Initialise Stripe sync (idempotent — safe on every startup)
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl: process.env.DATABASE_URL!, schema: "stripe" } as any);
    const stripeSync = await getStripeSync();
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || ""}`;
    if (webhookBaseUrl && webhookBaseUrl !== "https://") {
      try {
        await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
      } catch (e: any) {
        log(`[stripe] managed webhook setup skipped: ${e?.message || e}`);
      }
    }
    stripeSync
      .syncBackfill({ object: "all" })
      .then(() => log("[stripe] data sync complete"))
      .catch((err: any) => log(`[stripe] backfill error: ${err?.message || err}`));
    log("[stripe] initialised");
  } catch (err: any) {
    log(`[stripe] init failed: ${err?.message || err}`);
  }

  await registerRoutes(httpServer, app);

  startReminderScheduler();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
