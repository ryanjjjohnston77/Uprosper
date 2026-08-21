import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { sendPushToUser, sendPushToClientByClientId } from "./push";
import { getUncachableStripeClient } from "./stripeClient";
import {
  insertClientSchema,
  insertJourneyStepSchema,
  insertRewardSchema,
  insertOfferSchema,
  insertNotificationSchema,
  updatePaymentReminderSchema,
  insertMessageSchema,
  insertEnquirySchema,
  insertCompanyAnnouncementSchema,
  insertCompanyMessageSchema,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  reviewClientSchema,
  updateClientSchema,
  createClientAppointmentRequestSchema,
  createEngagementEventRequestSchema,
} from "@shared/schema";

const lastActiveBumpAt = new Map<string, number>();
const ACTIVE_BUMP_THROTTLE_MS = 5 * 60 * 1000;

function maybeBumpLastActive(userId: string): void {
  const now = Date.now();
  const last = lastActiveBumpAt.get(userId) || 0;
  if (now - last >= ACTIVE_BUMP_THROTTLE_MS) {
    lastActiveBumpAt.set(userId, now);
    storage.bumpUserLastActive(userId).catch((err) => console.error("[lastActive] bump failed", err));
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function requireCompany(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.role !== "company") {
    return res.status(403).json({ error: "Company access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Marketplace affiliate click tracker — appends `sid` and 302-redirects to
  // the partner's CJ deeplink. SID format: c{clientId}-b{brokerUserId}-d{dealId}
  // (max 50 chars), or `guest-d{dealId}` when not authenticated.
  app.get("/api/marketplace/click/:dealId", async (req, res) => {
    try {
      const dealId = String(req.params.dealId || "");
      const deal = await storage.getAffiliateDeal(dealId);
      if (!deal || deal.status !== 'active' || !deal.trackingUrl) {
        return res.status(404).send("Deal not found");
      }
      // Defence-in-depth: never redirect to non-http(s) URLs even if a
      // legacy/malicious row somehow stored one.
      try {
        const proto = new URL(deal.trackingUrl).protocol;
        if (proto !== 'http:' && proto !== 'https:') return res.status(404).send("Invalid deal URL");
      } catch {
        return res.status(404).send("Invalid deal URL");
      }
      const clickUrl = deal.trackingUrl;

      let clientId: number | null = null;
      let brokerUserId: string | null = null;
      if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          if (user.role === "client") {
            const client = await storage.getClientByEmail(user.email);
            if (client) {
              clientId = client.id;
              brokerUserId = client.brokerUserId || null;
            }
          } else if (user.role === "broker") {
            brokerUserId = user.id;
          }
        }
      }

      const sid = (clientId
        ? `c${clientId}-b${brokerUserId || ""}-d${dealId}`
        : `guest-d${dealId}`
      ).slice(0, 50);

      storage
        .createMarketplaceClick({
          clientId,
          brokerUserId,
          dealId,
          sid,
          userAgent: req.get("user-agent") || null,
          referer: req.get("referer") || null,
        })
        .catch((err) => console.error("[marketplace/click] log failed", err));

      const target = new URL(clickUrl);
      target.searchParams.set("sid", sid);
      return res.redirect(302, target.toString());
    } catch (err: any) {
      console.error("[marketplace/click]", err);
      return res.status(500).send("Tracking error");
    }
  });

  async function generateUniqueBrokerCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await storage.getUserByBrokerCode(code);
      if (!existing) return code;
      attempts++;
    }
    throw new Error("Failed to generate unique broker code");
  }

  async function generateUniqueCompanyCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    while (attempts < 10) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await storage.getCompanyByCode(code);
      if (!existing) return code;
      attempts++;
    }
    throw new Error("Failed to generate unique company code");
  }

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      if (req.body?.email) req.body.email = req.body.email.trim().toLowerCase();
      const data = signupSchema.parse(req.body);
      const normalizedEmail = data.email;
      
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const allowedPublicRoles = ["client", "broker", "company"];
      const role = allowedPublicRoles.includes(data.role || "") ? data.role! : "client";
      
      // Generate broker code for broker signups
      let brokerCode: string | null = null;
      let companyId: number | null = null;
      if (role === "broker") {
        brokerCode = await generateUniqueBrokerCode();
        if (data.companyCode) {
          const company = await storage.getCompanyByCode(data.companyCode);
          if (!company) {
            return res.status(400).json({ error: "Invalid company code" });
          }
          companyId = company.id;
        }
      }

      // For company signups, create a company record and generate company code
      let newCompanyCode: string | null = null;
      if (role === "company") {
        const code = await generateUniqueCompanyCode();
        const company = await storage.createCompany({
          name: data.name,
          companyCode: code,
          contactEmail: normalizedEmail,
        });
        companyId = company.id;
        newCompanyCode = code;
      }
      
      // Find broker by code for client signups
      let assignedBrokerId: string | null = null;
      if (role === "client" && data.brokerCode) {
        const broker = await storage.getUserByBrokerCode(data.brokerCode);
        if (!broker || broker.role !== "broker") {
          return res.status(400).json({ error: "Invalid broker code" });
        }
        assignedBrokerId = broker.id;
      }
      
      // Find referrer client by referral code
      let referrerClient: Awaited<ReturnType<typeof storage.getClientByReferralCode>> = undefined;
      if (role === "client" && data.referralCode) {
        referrerClient = await storage.getClientByReferralCode(data.referralCode);
        // Silently ignore invalid referral codes - don't block signup
      }
      
      const user = await storage.createUser({
        email: normalizedEmail,
        password: hashedPassword,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        role,
        brokerCode,
        companyId,
        termsAcceptedAt: new Date(),
      });

      // Create or update client record for client signups
      if (role === "client") {
        const existingClient = await storage.getClientByEmail(normalizedEmail);
        let clientId: number;
        
        if (existingClient) {
          if (assignedBrokerId) {
            await storage.updateClient(existingClient.id, { brokerUserId: assignedBrokerId });
          }
          clientId = existingClient.id;
          
          // Check if welcome notifications already exist for this client
          const existingNotifications = await storage.getClientNotifications(clientId);
          const hasWelcome = existingNotifications.some(n => n.type === "welcome");
          const hasDiscounts = existingNotifications.some(n => n.type === "homeowner_discounts");
          
          if (!hasWelcome) {
            await storage.createNotification({
              clientId,
              type: "welcome",
              title: "Welcome to Uprosper! 🎉",
              message: "We're excited to have you on board. Your prosperity journey starts here! 🚀",
            });
          }
          if (!hasDiscounts) {
            await storage.createNotification({
              clientId,
              type: "homeowner_discounts",
              title: "Homeowner Discounts 🏠",
              message: "Exclusive discounts from top brands to help make your new house a home!",
            });
          }
        } else {
          const newClient = await storage.createClient({
            name: data.name,
            email: normalizedEmail,
            mortgageValue: "0",
            renewalDate: new Date().toISOString().split('T')[0],
            brokerUserId: assignedBrokerId || undefined,
            referredByClientId: referrerClient?.id,
          });
          clientId = newClient.id;
          
          // Create referral record if referred by another client
          if (referrerClient) {
            await storage.createReferral({
              referrerClientId: referrerClient.id,
              referredClientId: clientId,
              status: "pending",
              rewardAmount: "25.00",
            });

            // Credit the referrer with a £25 reward
            await storage.createReward({
              clientId: referrerClient.id,
              type: "referral_bonus",
              title: "Referral Reward - £25",
              description: `You earned £25 for referring ${data.name} to Uprosper! Thank you for spreading the word. 🎉`,
              claimed: false,
            });

            // Notify the referrer about their reward
            await storage.createNotification({
              clientId: referrerClient.id,
              type: "referral_reward",
              title: "You've earned a referral reward! 🎉",
              message: `Great news! ${data.name} just signed up using your referral code. You've earned £25! 💰`,
            });

            sendPushToClientByClientId(referrerClient.id, {
              title: `🎉 You earned £25 for referring ${data.name}`,
              body: "",
              url: "/client",
              tag: "reward-referral-" + referrerClient.id,
            }).catch(() => {});
          }
          
          // Create welcome notifications for new clients
          await storage.createNotification({
            clientId,
            type: "welcome",
            title: "Welcome to Uprosper! 🎉",
            message: "We're excited to have you on board. Your prosperity journey starts here! 🚀",
          });
          
          await storage.createNotification({
            clientId,
            type: "homeowner_discounts",
            title: "Homeowner Discounts 🏠",
            message: "Exclusive discounts from top brands to help make your new house a home!",
          });

          sendPushToClientByClientId(clientId, {
            title: "Homeowner Discounts 🏠 Exclusive deals waiting for you!",
            body: "",
            url: "/client",
            tag: "discounts-" + clientId,
          }).catch(() => {});
        }
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      const { password: _, ...userWithoutPassword } = user;
      const responseData: any = { ...userWithoutPassword };
      if (newCompanyCode) {
        responseData.companyCode = newCompanyCode;
      }
      res.status(201).json(responseData);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid signup data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      if (req.body?.email) req.body.email = req.body.email.trim().toLowerCase();
      const data = loginSchema.parse(req.body);
      const normalizedEmail = data.email;
      
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(data.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      const { password: _, ...userWithoutPassword } = user;
      const responseData: any = { ...userWithoutPassword };
      if (user.role === "company" && user.companyId) {
        const company = await storage.getCompany(user.companyId);
        if (company) {
          responseData.companyCode = company.companyCode;
          responseData.companyName = company.name;
        }
      }
      res.json(responseData);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    maybeBumpLastActive(user.id);

    const { password: _, ...userWithoutPassword } = user;
    const responseData: any = { ...userWithoutPassword };
    if (user.role === "company" && user.companyId) {
      const company = await storage.getCompany(user.companyId);
      if (company) {
        responseData.companyCode = company.companyCode;
        responseData.companyName = company.name;
      }
    }
    res.json(responseData);
  });

  // ─── Billing (Stripe) ────────────────────────────────────────────────
  const requireBroker = async (req: Request, res: Response): Promise<any> => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return null;
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return null;
    }
    if (user.role !== "broker") {
      res.status(403).json({ error: "Broker access required" });
      return null;
    }
    return user;
  };

  app.post("/api/billing/checkout", async (req, res) => {
    const user = await requireBroker(req, res);
    if (!user) return;
    try {
      const plan = String(req.body?.plan || "").toLowerCase();
      const bandRaw = req.body?.band;
      const band = bandRaw == null || bandRaw === "" ? null : Number(bandRaw);

      if (!["starter", "growth"].includes(plan)) {
        return res.status(400).json({ error: "Unsupported plan" });
      }
      if (plan === "growth" && (!Number.isInteger(band) || (band as number) < 1 || (band as number) > 3)) {
        return res.status(400).json({ error: "Growth band must be 1, 2, or 3" });
      }

      const priceId = await storage.getPriceIdForPlan(plan, plan === "growth" ? band : null);
      if (!priceId) {
        return res.status(503).json({
          error: "Pricing not yet synced from Stripe. Run scripts/seed-products.ts and try again in a moment.",
        });
      }

      const stripe = await getUncachableStripeClient();
      const origin = `${req.protocol}://${req.get("host")}`;

      // Guard against duplicate subscriptions — if the broker already has an
      // active/trialing/past_due/unpaid subscription, send them to the Customer
      // Portal to switch plans instead of creating a second subscription.
      if (user.stripeCustomerId) {
        const existing = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: "all",
          limit: 10,
        });
        const live = existing.data.find((s) =>
          ["active", "trialing", "past_due", "unpaid"].includes(s.status)
        );
        if (live) {
          const portal = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${origin}/broker`,
          });
          return res.status(200).json({ url: portal.url, alreadySubscribed: true });
        }
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { trial_period_days: 14 },
        success_url: `${origin}/broker?checkout=success`,
        cancel_url: `${origin}/broker?checkout=cancelled`,
        allow_promotion_codes: true,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[billing/checkout]", err);
      res.status(500).json({ error: err?.message || "Checkout failed" });
    }
  });

  app.post("/api/billing/portal", async (req, res) => {
    const user = await requireBroker(req, res);
    if (!user) return;
    try {
      if (!user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer on file" });
      }
      const stripe = await getUncachableStripeClient();
      const origin = `${req.protocol}://${req.get("host")}`;
      const portal = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/broker`,
      });
      res.json({ url: portal.url });
    } catch (err: any) {
      console.error("[billing/portal]", err);
      res.status(500).json({ error: err?.message || "Portal failed" });
    }
  });

  app.patch("/api/auth/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const data = parsed.data;
      if (data.dateOfBirth === "") data.dateOfBirth = undefined;
      if (data.calendarUrl !== undefined) {
        const currentUser = await storage.getUser(req.session.userId);
        if (currentUser?.role !== "broker") {
          delete (data as any).calendarUrl;
        }
      }
      const updated = await storage.updateUser(req.session.userId, data);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/clients", requireAdmin, async (req, res) => {
    try {
      const clients = await storage.getUsersByRole("client");
      const clientsWithoutPasswords = clients.map(({ password: _, ...user }) => user);
      res.json(clientsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client users" });
    }
  });

  app.get("/api/admin/users/brokers", requireAdmin, async (req, res) => {
    try {
      const brokers = await storage.getUsersByRole("broker");
      const brokersWithoutPasswords = brokers.map(({ password: _, ...user }) => user);
      res.json(brokersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker users" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const totalUsers = await storage.getTotalUsersCount();
      const clientCount = await storage.countUsersByRole("client");
      const brokerCount = await storage.countUsersByRole("broker");
      const adminCount = await storage.countUsersByRole("admin");

      res.json({
        totalUsers,
        clientCount,
        brokerCount,
        adminCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      if (req.body?.email) req.body.email = req.body.email.trim().toLowerCase();
      const data = signupSchema.parse({ ...req.body, termsAccepted: true });
      const normalizedEmail = data.email;
      
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const validRoles = ["client", "broker", "admin"];
      const role = validRoles.includes(data.role || "") ? data.role : "client";
      
      const user = await storage.createUser({
        email: normalizedEmail,
        password: hashedPassword,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        role: role!,
        termsAcceptedAt: new Date(),
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid user data" });
    }
  });

  app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
    try {
      const overview = await storage.getAdminOverview();
      res.json(overview);
    } catch (error: any) {
      console.error("[admin/overview]", error);
      res.status(500).json({ error: "Failed to fetch overview" });
    }
  });

  app.get("/api/admin/all-clients", requireAdmin, async (_req, res) => {
    try {
      const clients = await storage.getAllClientsAdmin();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/admin/all-brokers", requireAdmin, async (_req, res) => {
    try {
      const brokers = await storage.getAllBrokersAdmin();
      res.json(brokers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brokers" });
    }
  });

  app.get("/api/admin/all-companies", requireAdmin, async (_req, res) => {
    try {
      const companies = await storage.getAllCompaniesAdmin();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/marketplace/deals", async (_req, res) => {
    try {
      const deals = await storage.listAffiliateDeals({ activeOnly: true });
      const sanitized = deals.map(({ trackingUrl: _t, ...rest }) => rest);
      res.json(sanitized);
    } catch (e) {
      res.status(500).json({ error: "Failed to load deals" });
    }
  });

  app.get("/api/admin/affiliate-deals", requireAdmin, async (_req, res) => {
    try {
      const [deals, clicks30d, clicks7d] = await Promise.all([
        storage.listAffiliateDeals(),
        storage.getDealClickCounts(30),
        storage.getDealClickCounts(7),
      ]);
      res.json(deals.map(d => ({ ...d, clicks7d: clicks7d[d.id] || 0, clicks30d: clicks30d[d.id] || 0 })));
    } catch (e) {
      res.status(500).json({ error: "Failed to load deals" });
    }
  });

  function validHttpUrl(u: unknown): boolean {
    if (typeof u !== 'string' || !u) return false;
    try { const p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; }
    catch { return false; }
  }

  app.post("/api/admin/affiliate-deals", requireAdmin, async (req, res) => {
    try {
      const { insertAffiliateDealSchema } = await import("@shared/schema");
      const parsed = insertAffiliateDealSchema.parse(req.body);
      if (parsed.tab !== 'homeware' && parsed.tab !== 'leisure') {
        return res.status(400).json({ error: "tab must be 'homeware' or 'leisure'" });
      }
      if (!validHttpUrl(parsed.trackingUrl)) {
        return res.status(400).json({ error: "trackingUrl must be a valid http(s) URL" });
      }
      if (parsed.logoUrl && !validHttpUrl(parsed.logoUrl)) {
        return res.status(400).json({ error: "logoUrl must be a valid http(s) URL" });
      }
      const existing = await storage.getAffiliateDeal(parsed.id);
      if (existing) return res.status(409).json({ error: "Deal id already exists" });
      const deal = await storage.createAffiliateDeal(parsed);
      res.status(201).json(deal);
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Invalid deal" });
    }
  });

  app.patch("/api/admin/affiliate-deals/:id", requireAdmin, async (req, res) => {
    try {
      const { updateAffiliateDealSchema } = await import("@shared/schema");
      const parsed = updateAffiliateDealSchema.parse(req.body);
      if (parsed.tab && parsed.tab !== 'homeware' && parsed.tab !== 'leisure') {
        return res.status(400).json({ error: "tab must be 'homeware' or 'leisure'" });
      }
      if (parsed.trackingUrl !== undefined && !validHttpUrl(parsed.trackingUrl)) {
        return res.status(400).json({ error: "trackingUrl must be a valid http(s) URL" });
      }
      if (parsed.logoUrl !== undefined && parsed.logoUrl && !validHttpUrl(parsed.logoUrl)) {
        return res.status(400).json({ error: "logoUrl must be a valid http(s) URL" });
      }
      const updated = await storage.updateAffiliateDeal(req.params.id, parsed);
      if (!updated) return res.status(404).json({ error: "Deal not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Invalid update" });
    }
  });

  app.delete("/api/admin/affiliate-deals/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.deleteAffiliateDeal(req.params.id);
      if (!ok) return res.status(404).json({ error: "Deal not found" });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  app.patch("/api/admin/brokers/:id/assign-company", requireAdmin, async (req, res) => {
    try {
      const brokerUserId = req.params.id;
      const { companyId } = req.body as { companyId: number | null };

      const broker = await storage.getUser(brokerUserId);
      if (!broker || broker.role !== "broker") {
        return res.status(404).json({ error: "Broker not found" });
      }

      if (companyId !== null && companyId !== undefined) {
        const company = await storage.getCompany(companyId);
        if (!company) return res.status(400).json({ error: "Invalid company ID" });
      }

      const updated = await storage.setBrokerCompany(brokerUserId, companyId ?? null);
      if (!updated) return res.status(404).json({ error: "Broker not found" });
      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch (error) {
      console.error("[admin/assign-company]", error);
      res.status(500).json({ error: "Failed to assign company to broker" });
    }
  });

  app.patch("/api/admin/clients/:id/assign-broker", requireAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { brokerUserId } = req.body;
      
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      if (brokerUserId) {
        const broker = await storage.getUser(brokerUserId);
        if (!broker || broker.role !== "broker") {
          return res.status(400).json({ error: "Invalid broker user ID" });
        }
      }
      
      const client = await storage.assignClientToBroker(clientId, brokerUserId || null);
      // Sanitized response — admins must never receive client mortgage financials.
      res.json({
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
        brokerUserId: client.brokerUserId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to assign broker to client" });
    }
  });
  
  // Client routes
  app.get("/api/client/me", requireAuth, async (req, res) => {
    try {
      // Only clients can access their own client profile
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client profile:", error);
      res.status(500).json({ error: "Failed to fetch client profile" });
    }
  });

  app.get("/api/client/referral-code", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      const referralCode = await storage.generateReferralCode(client.id);
      res.json({ referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  app.get("/api/client/broker-info", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      if (!client.brokerUserId) {
        return res.status(404).json({ error: "No broker assigned" });
      }
      const broker = await storage.getUser(client.brokerUserId);
      if (!broker || broker.role !== "broker") {
        return res.status(404).json({ error: "Broker not found" });
      }
      let companyLogoUrl: string | null = null;
      let companyName: string | null = null;
      if (broker.companyId) {
        const company = await storage.getCompany(broker.companyId);
        if (company) {
          companyLogoUrl = company.logoUrl || null;
          companyName = company.name;
        }
      }
      res.json({
        brokerName: broker.name,
        brokerCode: broker.brokerCode,
        calendarUrl: broker.calendarUrl || null,
        companyLogoUrl,
        companyName,
      });
    } catch (error) {
      console.error("Error fetching broker info:", error);
      res.status(500).json({ error: "Failed to fetch broker info" });
    }
  });

  app.get("/api/client/referral-stats", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      const stats = await storage.getReferralStats(client.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      if (req.session.role === "broker") {
        const clients = await storage.getClientsByBrokerUserId(req.session.userId!);
        return res.json(clients);
      }
      // Admins must never see client mortgage financials via this endpoint.
      // Use /api/admin/all-clients (sanitized) for admin-facing client lists.
      return res.status(403).json({ error: "Use /api/admin/all-clients for admin client lists" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/broker/my-clients", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const clients = await storage.getClientsByBrokerUserId(req.session.userId!);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker clients" });
    }
  });

  app.get("/api/broker/engagement-summary", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const summary = await storage.getBrokerEngagementSummary(req.session.userId!);
      res.json(summary);
    } catch (error) {
      console.error("[broker] engagement summary failed", error);
      res.status(500).json({ error: "Failed to load engagement summary" });
    }
  });

  app.post("/api/client/event", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const parsed = createEngagementEventRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid event payload" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      const event = await storage.createEngagementEvent({
        clientId: client.id,
        eventType: parsed.data.eventType,
        metadata: parsed.data.metadata ?? null,
      });
      maybeBumpLastActive(user.id);
      res.json({ id: event.id });
    } catch (error) {
      console.error("[engagement] event create failed", error);
      res.status(500).json({ error: "Failed to record event" });
    }
  });

  app.get("/api/broker/my-clients/journeys", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const clients = await storage.getClientsByBrokerUserId(req.session.userId!);
      const clientIds = clients.map(c => c.id);
      const steps = await storage.getJourneyStepsForClients(clientIds);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journey steps" });
    }
  });

  app.get("/api/broker/unreviewed-clients", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const clients = await storage.getUnreviewedClientsByBroker(req.session.userId!);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unreviewed clients" });
    }
  });

  app.patch("/api/clients/:id/review", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      if (!client || client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to review this client" });
      }
      const parsed = reviewClientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid review data", details: parsed.error.flatten() });
      }
      const updated = await storage.markClientReviewed(clientId, {
        mortgageValue: parsed.data.mortgageValue,
        mortgageTerm: parsed.data.mortgageTerm,
        interestRate: parsed.data.interestRate,
        renewalDate: parsed.data.renewalDate,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to review client" });
    }
  });

  app.get("/api/broker/notifications", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const notifications = await storage.getBrokerNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker notifications" });
    }
  });

  app.post("/api/broker/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const id = parseInt(req.params.id);
      const notification = await storage.markBrokerNotificationRead(id, req.session.userId!);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.get("/api/broker/commission", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const commissionData = await storage.getBrokerCommission(req.session.userId!);
      res.json(commissionData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commission data" });
    }
  });

  app.get("/api/broker/wallet", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const commissionData = await storage.getBrokerCommission(req.session.userId!);
      const paidTotal = await storage.getBrokerPaidTotal(req.session.userId!);
      const payouts = await storage.getBrokerPayouts(req.session.userId!);
      const pendingPayouts = payouts.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalEarned = commissionData.totalRevenue;
      res.json({
        totalEarned,
        availableBalance: Math.max(0, 0 - paidTotal - pendingPayouts),
        pendingPayouts,
        paidTotal,
        payouts,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallet data" });
    }
  });

  app.post("/api/broker/payout-request", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const commissionData = await storage.getBrokerCommission(req.session.userId!);
      const paidTotal = await storage.getBrokerPaidTotal(req.session.userId!);
      const payouts = await storage.getBrokerPayouts(req.session.userId!);
      const pendingPayouts = payouts.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const availableBalance = 0 - paidTotal - pendingPayouts;

      if (availableBalance <= 0) {
        return res.status(400).json({ error: "No available balance to request payout" });
      }

      const payout = await storage.createPayoutRequest({
        brokerUserId: req.session.userId!,
        amount: availableBalance.toFixed(2),
        status: "pending",
      });
      res.json(payout);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payout request" });
    }
  });

  app.get("/api/admin/payouts", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const payouts = await storage.getAllPayouts();
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  app.patch("/api/admin/payouts/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { status } = req.body;
      if (!["approved", "paid", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const payout = await storage.updatePayoutStatus(parseInt(req.params.id), status);
      res.json(payout);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payout" });
    }
  });

  app.get("/api/admin/reward-queue", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const status = req.query.status as string | undefined;
      const items = status ? await storage.getRewardQueueByStatus(status) : await storage.getAllRewardQueue();
      const enriched = await Promise.all(items.map(async (item) => {
        const client = await storage.getClient(item.clientId);
        return { ...item, clientName: client?.name || 'Unknown', clientEmail: client?.email || 'Unknown' };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reward queue" });
    }
  });

  app.patch("/api/admin/reward-queue/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { qrCodeData } = req.body;
      if (!qrCodeData) {
        return res.status(400).json({ error: "QR code data is required" });
      }
      const updated = await storage.updateRewardQueueItem(parseInt(req.params.id), { qrCodeData });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reward" });
    }
  });

  app.post("/api/admin/reward-queue/:id/send", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const item = await storage.getRewardQueueItem(parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ error: "Reward not found" });
      }
      if (!item.qrCodeData) {
        return res.status(400).json({ error: "QR code must be uploaded before sending" });
      }
      await storage.createNotification({
        clientId: item.clientId,
        type: 'costa_reward',
        title: '☕ Costa Coffee Reward!',
        message: `Congratulations on completing "${item.stepTitle}"! Here's your Costa Coffee gift card as a reward.`,
        read: false,
      });
      const updated = await storage.updateRewardQueueItem(item.id, { status: 'sent', sentAt: new Date() });
      try {
        sendPushToClientByClientId(item.clientId, {
          title: '☕ Costa Coffee Reward!',
          body: `You earned a Costa Coffee gift card for completing "${item.stepTitle}"!`,
          url: '/client',
          tag: 'costa_reward',
        });
      } catch {}
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to send reward" });
    }
  });

  app.post("/api/admin/queue-costa-reward", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { clientId } = req.body;
      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }
      const cid = parseInt(clientId);
      const item = await storage.createRewardQueueItem({
        clientId: cid,
        stepId: 0,
        stepTitle: 'Admin Costa Reward',
        status: 'pending',
      });
      res.json(item);
    } catch (error: any) {
      console.error('Queue costa reward error:', error?.message || error);
      res.status(500).json({ error: "Failed to queue reward" });
    }
  });

  app.get("/api/client/reward-qr/:clientId/:stepTitle", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const stepTitle = decodeURIComponent(req.params.stepTitle);
      if (req.session.role === 'client') {
        const user = await storage.getUser(req.session.userId!);
        if (!user) return res.status(403).json({ error: "Forbidden" });
        const ownClient = await storage.getClientByEmail(user.email);
        if (!ownClient || ownClient.id !== clientId) {
          return res.status(403).json({ error: "Forbidden" });
        }
      } else if (req.session.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }
      const allItems = await storage.getAllRewardQueue();
      const item = allItems.find(r => r.clientId === clientId && r.stepTitle === stepTitle && r.status === 'sent');
      if (!item || !item.qrCodeData) {
        return res.status(404).json({ error: "QR code not found" });
      }
      res.json({ qrCodeData: item.qrCodeData });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QR code" });
    }
  });

  app.get("/api/admin/all-clients-with-journey", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allUsers = await storage.getAllUsers();
      const clientUsers = allUsers.filter(u => u.role === 'client');
      const enriched = await Promise.all(clientUsers.map(async (u) => {
        const clients = await storage.getClientByEmail(u.email);
        const client = clients;
        let journeySteps: any[] = [];
        if (client) {
          journeySteps = await storage.getClientJourneySteps(client.id);
        }
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          clientId: client?.id || null,
          completedSteps: journeySteps.filter(s => s.status === 'completed').length,
          totalSteps: 5,
          journeySteps,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients with journey" });
    }
  });

  app.post("/api/broker/send-notification", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      
      const allowedTypes = ['reward', 'fixed_rate_ending', 'moving_house', 'home_insurance', 'life_insurance', 'wealth'];
      const { clientId, type, title, message } = req.body;
      
      if (!clientId || typeof clientId !== 'number') {
        return res.status(400).json({ error: "Valid clientId is required" });
      }
      if (!type || !allowedTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${allowedTypes.join(', ')}` });
      }
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      const defaultMessages: Record<string, string> = {
        reward: "Click here to claim!",
        fixed_rate_ending: "Your fixed-rate mortgage is ending soon. Let's discuss your options to ensure you get the best deal.",
        moving_house: "Thinking of moving or upsizing? We can help you explore your mortgage options.",
        home_insurance: "Protect your home with the right insurance. Get in touch to find out more.",
        life_insurance: "Secure your family's future with life insurance. Let's have a chat about your options.",
        wealth: "Discover wealth-building opportunities tailored to your financial goals."
      };
      const finalMessage = (message && typeof message === 'string' && message.trim().length > 0) 
        ? message.trim() 
        : defaultMessages[type] || "You have a new notification from your broker.";
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (client.brokerUserId && client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied to this client" });
      }
      
      const notification = await storage.createNotification({
        clientId,
        type,
        title: title.trim(),
        message: finalMessage,
        read: false
      });

      sendPushToClientByClientId(clientId, {
        title: title.trim(),
        body: "",
        url: "/client",
        tag: `notification-${type}-${notification.id}`,
      }).catch(() => {});

      res.status(201).json(notification);
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (req.session.role === "broker" && client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      if (req.session.role === "broker") {
        (data as any).brokerUserId = req.session.userId;
      }
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker" && req.session.role !== "admin") {
        return res.status(403).json({ error: "Broker or admin access required" });
      }
      const existingClient = await storage.getClient(parseInt(req.params.id));
      if (!existingClient) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (req.session.role === "broker" && existingClient.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const parsed = updateClientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten() });
      }
      const client = await storage.updateClient(parseInt(req.params.id), parsed.data);
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  // Journey Steps routes
  app.get("/api/clients/:clientId/journey", async (req, res) => {
    try {
      const steps = await storage.getClientJourneySteps(parseInt(req.params.clientId));
      res.json(steps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journey steps" });
    }
  });

  app.post("/api/journey-steps", async (req, res) => {
    try {
      const data = insertJourneyStepSchema.parse(req.body);
      const step = await storage.createJourneyStep(data);
      res.status(201).json(step);
    } catch (error) {
      res.status(400).json({ error: "Invalid journey step data" });
    }
  });

  app.patch("/api/journey-steps/:id", async (req, res) => {
    try {
      const step = await storage.updateJourneyStep(parseInt(req.params.id), req.body);
      res.json(step);
    } catch (error) {
      res.status(400).json({ error: "Failed to update journey step" });
    }
  });

  // Toggle journey step completion (broker action)
  app.post("/api/broker/clients/:clientId/journey-toggle", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== 'broker' && req.session.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      const clientId = parseInt(req.params.clientId);
      const { stepId, stepTitle } = req.body;
      
      // Validate stepId is within allowed range (1-5 for journey steps)
      if (typeof stepId !== 'number' || stepId < 1 || stepId > 5) {
        return res.status(400).json({ error: "Invalid step ID" });
      }
      if (typeof stepTitle !== 'string' || stepTitle.trim().length === 0) {
        return res.status(400).json({ error: "Invalid step title" });
      }
      
      // Check client exists and broker has access
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (req.session.role === 'broker' && client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied - not your client" });
      }
      
      // Check if step exists for this client
      const existingSteps = await storage.getClientJourneySteps(clientId);
      
      // Progressive unlock validation: step must be within unlocked range
      const completedIds = existingSteps.filter(s => s.status === 'completed').map(s => s.stepId);
      const maxCompletedId = completedIds.length > 0 ? Math.max(...completedIds) : 0;
      const maxUnlockedId = Math.max(2, maxCompletedId + 2);
      if (stepId > maxUnlockedId) {
        return res.status(400).json({ error: "This step is locked. Complete earlier steps first." });
      }
      
      const existingStep = existingSteps.find(s => s.stepId === stepId);
      
      if (existingStep) {
        const newStatus = existingStep.status === 'completed' ? 'available' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date() : null;
        const updated = await storage.updateJourneyStep(existingStep.id, { 
          status: newStatus,
          completedAt
        });
        if (newStatus === 'completed') {
          const existingReward = await storage.getRewardQueueByClientAndStep(clientId, stepId);
          if (!existingReward) {
            await storage.createRewardQueueItem({ clientId, stepId, stepTitle, status: 'pending' });
          }
        }
        res.json(updated);
      } else {
        const newStep = await storage.createJourneyStep({
          clientId,
          stepId,
          stepTitle,
          status: 'completed',
          completedAt: new Date()
        });
        const existingReward = await storage.getRewardQueueByClientAndStep(clientId, stepId);
        if (!existingReward) {
          await storage.createRewardQueueItem({ clientId, stepId, stepTitle, status: 'pending' });
        }
        res.json(newStep);
      }
    } catch (error) {
      res.status(400).json({ error: "Failed to toggle journey step" });
    }
  });

  // Rewards routes
  app.get("/api/clients/:clientId/rewards", async (req, res) => {
    try {
      const rewards = await storage.getClientRewards(parseInt(req.params.clientId));
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      const data = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(data);

      sendPushToClientByClientId(data.clientId, {
        title: `🎁 ${data.title || "You've unlocked a new reward"}`,
        body: "",
        url: "/client",
        tag: "reward-" + reward.id,
      }).catch(() => {});

      res.status(201).json(reward);
    } catch (error) {
      res.status(400).json({ error: "Invalid reward data" });
    }
  });

  app.post("/api/rewards/:id/claim", async (req, res) => {
    try {
      const reward = await storage.claimReward(parseInt(req.params.id));
      res.json(reward);
    } catch (error) {
      res.status(400).json({ error: "Failed to claim reward" });
    }
  });

  // Offers routes
  app.get("/api/clients/:clientId/offers", async (req, res) => {
    try {
      const offers = await storage.getClientOffers(parseInt(req.params.clientId));
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", async (req, res) => {
    try {
      const data = insertOfferSchema.parse(req.body);
      const offer = await storage.createOffer(data);

      sendPushToClientByClientId(data.clientId, {
        title: `📢 ${data.title || "Your broker has a new offer for you"}`,
        body: "",
        url: "/client",
        tag: "offer-" + offer.id,
      }).catch(() => {});

      res.status(201).json(offer);
    } catch (error) {
      res.status(400).json({ error: "Invalid offer data" });
    }
  });

  // Notifications routes
  app.get("/api/clients/:clientId/notifications", async (req, res) => {
    try {
      const notifications = await storage.getClientNotifications(parseInt(req.params.clientId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const data = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(data);

      const SILENT_NOTIFICATION_TYPES = new Set(["welcome_back"]);

      if (data.clientId && !SILENT_NOTIFICATION_TYPES.has(data.type)) {
        sendPushToClientByClientId(data.clientId, {
          title: data.title || "🔔 New Update",
          body: "",
          url: "/client",
          tag: `notification-${data.type}-${notification.id}`,
        }).catch(() => {});
      }

      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(parseInt(req.params.id));
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: "Failed to mark notification as read" });
    }
  });

  // Payment reminders (logged-in client only)
  async function resolveClientForSession(req: Request): Promise<{ clientId: number } | null> {
    if (req.session.role !== "client") return null;
    const user = await storage.getUser(req.session.userId!);
    if (!user) return null;
    const client = await storage.getClientByEmail(user.email);
    if (!client) return null;
    return { clientId: client.id };
  }

  app.get("/api/payment-reminders/me", requireAuth, async (req, res) => {
    try {
      const ctx = await resolveClientForSession(req);
      if (!ctx) return res.status(403).json({ error: "Client access required" });
      const reminder = await storage.getPaymentReminderByClient(ctx.clientId);
      res.json(reminder || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminder" });
    }
  });

  app.put("/api/payment-reminders/me", requireAuth, async (req, res) => {
    try {
      const ctx = await resolveClientForSession(req);
      if (!ctx) return res.status(403).json({ error: "Client access required" });
      const parsed = updatePaymentReminderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid reminder data" });
      }
      const data = parsed.data;
      const reminder = await storage.upsertPaymentReminder(ctx.clientId, {
        dayOfMonth: data.dayOfMonth,
        customMessage: data.customMessage ?? null,
        enabled: data.enabled,
      });
      res.json(reminder);
    } catch (error) {
      console.error("[PaymentReminder] upsert failed:", error);
      res.status(500).json({ error: "Failed to save reminder" });
    }
  });

  app.delete("/api/payment-reminders/me", requireAuth, async (req, res) => {
    try {
      const ctx = await resolveClientForSession(req);
      if (!ctx) return res.status(403).json({ error: "Client access required" });
      // Soft-disable: keeps the row + dedupe history so re-enabling later behaves predictably.
      const updated = await storage.deletePaymentReminder(ctx.clientId);
      res.json(updated || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to disable reminder" });
    }
  });

  // Messages routes
  app.get("/api/broker/messages", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const messages = await storage.getBrokerMessages(req.session.userId!);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      // Only clients can send messages to brokers
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Only clients can send messages" });
      }
      
      const data = insertMessageSchema.parse(req.body);
      
      // Verify the client exists
      const client = await storage.getClient(data.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.email.toLowerCase() !== client.email.toLowerCase()) {
        return res.status(403).json({ error: "You can only send messages from your own client account" });
      }
      
      // Verify the broker is the one assigned to this client
      if (client.brokerUserId !== data.brokerUserId) {
        return res.status(403).json({ error: "You can only message your assigned broker" });
      }
      
      const message = await storage.createMessage(data);

      sendPushToUser(data.brokerUserId, {
        title: `💬 ${client.name} sent you a message`,
        body: "",
        url: "/broker",
        tag: "message-" + message.id,
      }).catch(() => {});

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.post("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      // Verify the authenticated user is a broker
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Only brokers can mark messages as read" });
      }
      
      // Mark message as read only if it belongs to this broker (single DB query)
      const updatedMessage = await storage.markMessageRead(
        parseInt(req.params.id), 
        req.session.userId!
      );
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found or not assigned to you" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Broker reply to client
  app.post("/api/broker/messages", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      
      const { clientId, content, subject, messageType, meetingLink } = req.body;
      
      if (!clientId || !content) {
        return res.status(400).json({ error: "clientId and content are required" });
      }

      const safeMessageType = messageType === "booking_link" ? "booking_link" : "message";
      const safeMeetingLink = safeMessageType === "booking_link" && typeof meetingLink === "string" && /^https?:\/\//i.test(meetingLink.trim())
        ? meetingLink.trim()
        : null;

      // Verify the client belongs to this broker
      const client = await storage.getClient(parseInt(clientId));
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      if (client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "You can only message your own clients" });
      }
      
      const message = await storage.createMessage({
        clientId: parseInt(clientId),
        brokerUserId: req.session.userId!,
        senderType: "broker",
        messageType: safeMessageType,
        subject: subject || null,
        content,
        meetingLink: safeMeetingLink,
        read: false,
      });

      sendPushToClientByClientId(parseInt(clientId), {
        title: safeMessageType === "booking_link" ? "📅 Schedule your consultation" : "💬 New message from your broker",
        body: safeMessageType === "booking_link" ? "Tap to book a time with your broker." : "",
        url: "/client",
        tag: "message-" + message.id,
      }).catch(() => {});
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending broker reply:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  // Client self-books an appointment after using broker's calendar link
  app.post("/api/client/appointments", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }

      const parsed = createClientAppointmentRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const { meetingDate, meetingTime, addReminder } = parsed.data;

      // Strict timezone-safe parsing of YYYY-MM-DD and HH:MM (server-local time)
      const dateParts = meetingDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const timeParts = meetingTime.match(/^(\d{1,2}):(\d{2})$/);
      if (!dateParts || !timeParts) {
        return res.status(400).json({ error: "Invalid date or time format" });
      }
      const year = parseInt(dateParts[1]);
      const month = parseInt(dateParts[2]);
      const day = parseInt(dateParts[3]);
      const hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      if (
        month < 1 || month > 12 ||
        day < 1 || day > 31 ||
        hours < 0 || hours > 23 ||
        minutes < 0 || minutes > 59
      ) {
        return res.status(400).json({ error: "Date or time out of range" });
      }
      const meetingDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      if (
        isNaN(meetingDateTime.getTime()) ||
        meetingDateTime.getFullYear() !== year ||
        meetingDateTime.getMonth() !== month - 1 ||
        meetingDateTime.getDate() !== day
      ) {
        return res.status(400).json({ error: "Invalid calendar date" });
      }

      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client record not found" });
      if (!client.brokerUserId) return res.status(400).json({ error: "No broker linked to this client" });

      // Compute remind_at = meetingDateTime - 24h (only if addReminder and still in the future)
      let remindAt: Date | null = null;
      if (addReminder) {
        const candidate = new Date(meetingDateTime.getTime() - 24 * 60 * 60 * 1000);
        if (candidate.getTime() > Date.now()) {
          remindAt = candidate;
        }
      }

      const appointment = await storage.createClientAppointment({
        clientId: client.id,
        brokerUserId: client.brokerUserId,
        meetingDate,
        meetingTime,
        remindAt,
      });

      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating client appointment:", error);
      res.status(500).json({ error: "Failed to save appointment" });
    }
  });

  // Get messages for a client (client fetches their conversation)
  app.get("/api/client/messages", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      
      const messages = await storage.getClientMessages(client.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Mark message as read by client
  app.post("/api/client/messages/:id/read", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const client = await storage.getClientByEmail(user.email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      
      const updatedMessage = await storage.markClientMessageRead(
        parseInt(req.params.id),
        client.id
      );
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Enquiries routes
  app.get("/api/broker/enquiries", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Broker access required" });
      }
      const enquiries = await storage.getBrokerEnquiries(req.session.userId!);
      res.json(enquiries);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      res.status(500).json({ error: "Failed to fetch enquiries" });
    }
  });

  app.post("/api/enquiries", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Only clients can send enquiries" });
      }
      
      const { clientId, productType, note } = req.body;
      
      if (!clientId || !productType) {
        return res.status(400).json({ error: "clientId and productType are required" });
      }

      let trimmedNote: string | null = null;
      if (note !== undefined && note !== null) {
        if (typeof note !== "string") {
          return res.status(400).json({ error: "note must be a string" });
        }
        const t = note.trim();
        if (t.length > 280) {
          return res.status(400).json({ error: "note must be 280 characters or fewer" });
        }
        trimmedNote = t.length > 0 ? t : null;
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.email.toLowerCase() !== client.email.toLowerCase()) {
        return res.status(403).json({ error: "You can only create enquiries for your own profile" });
      }
      
      if (!client.brokerUserId) {
        return res.status(400).json({ error: "No broker assigned to your profile" });
      }
      
      const enquiry = await storage.createEnquiry({
        clientId,
        brokerUserId: client.brokerUserId,
        productType,
        note: trimmedNote,
        status: "pending",
        read: false,
      });

      sendPushToUser(client.brokerUserId, {
        title: `📩 ${client.name} enquired about ${productType}`,
        body: trimmedNote || "",
        url: "/broker",
        tag: "enquiry-" + enquiry.id,
      }).catch(() => {});

      res.status(201).json(enquiry);
    } catch (error) {
      console.error("Error creating enquiry:", error);
      res.status(500).json({ error: "Failed to create enquiry" });
    }
  });

  app.post("/api/enquiries/:id/read", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Only brokers can mark enquiries as read" });
      }
      
      const updatedEnquiry = await storage.markEnquiryRead(
        parseInt(req.params.id),
        req.session.userId!
      );
      
      if (!updatedEnquiry) {
        return res.status(404).json({ error: "Enquiry not found or not assigned to you" });
      }
      
      res.json(updatedEnquiry);
    } catch (error) {
      console.error("Error marking enquiry read:", error);
      res.status(500).json({ error: "Failed to mark enquiry as read" });
    }
  });

  // Schedule meeting for an enquiry (broker action)
  app.post("/api/enquiries/:id/schedule", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Only brokers can schedule meetings" });
      }
      const { meetingDate, meetingTime, meetingLink } = req.body;
      if (!meetingDate || !meetingTime) {
        return res.status(400).json({ error: "Meeting date and time are required" });
      }
      
      const updated = await storage.updateEnquiry(parseInt(req.params.id), {
        meetingDate,
        meetingTime,
        meetingLink: meetingLink || null,
        meetingStatus: "scheduled",
        status: "scheduled",
        reminderSent: false,
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Enquiry not found" });
      }
      
      // Send notification to client
      const client = await storage.getClient(updated.clientId);
      if (client) {
        const formattedDate = new Date(meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        await storage.createNotification({
          clientId: updated.clientId,
          type: "meeting_scheduled",
          title: "Meeting Scheduled",
          message: `Your broker has scheduled a meeting for ${formattedDate} at ${meetingTime}. Please confirm or request a change.`,
        });

        sendPushToClientByClientId(updated.clientId, {
          title: `📅 Meeting booked for ${formattedDate} at ${meetingTime}`,
          body: "",
          url: "/client",
          tag: "meeting-" + updated.id,
        }).catch(() => {});
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ error: "Failed to schedule meeting" });
    }
  });

  // Broker-initiated meeting scheduling (without prior client enquiry)
  app.post("/api/broker/schedule-meeting", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Only brokers can schedule meetings" });
      }
      const { clientId, productType, meetingDate, meetingTime, meetingLink } = req.body;
      if (!clientId || !productType || !meetingDate || !meetingTime) {
        return res.status(400).json({ error: "Client, topic, date and time are all required" });
      }

      const client = await storage.getClient(clientId);
      if (!client || client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "This client is not assigned to you" });
      }

      const enquiry = await storage.createEnquiry({
        clientId,
        brokerUserId: req.session.userId!,
        productType,
        status: "scheduled",
        read: true,
        meetingDate,
        meetingTime,
        meetingStatus: "scheduled",
        meetingLink: meetingLink || null,
      });

      if (client) {
        const formattedDate = new Date(meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        await storage.createNotification({
          clientId,
          type: "meeting_scheduled",
          title: "Meeting Scheduled",
          message: `Your broker has scheduled a ${productType} meeting for ${formattedDate} at ${meetingTime}. Please confirm or request a change.`,
        });

        sendPushToClientByClientId(clientId, {
          title: `📅 ${productType} meeting booked for ${formattedDate} at ${meetingTime}`,
          body: "",
          url: "/client",
          tag: "meeting-" + enquiry.id,
        }).catch(() => {});
      }

      res.json(enquiry);
    } catch (error) {
      console.error("Error scheduling broker-initiated meeting:", error);
      res.status(500).json({ error: "Failed to schedule meeting" });
    }
  });

  // Client responds to meeting (confirm or request change)
  app.post("/api/enquiries/:id/meeting-response", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Only clients can respond to meetings" });
      }
      const { response } = req.body;
      if (!response || !["confirmed", "change_requested"].includes(response)) {
        return res.status(400).json({ error: "Invalid response" });
      }
      
      const updated = await storage.updateEnquiry(parseInt(req.params.id), {
        meetingStatus: response,
        status: response === "confirmed" ? "confirmed" : "change_requested",
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Enquiry not found" });
      }
      
      const client = await storage.getClient(updated.clientId);
      if (response === "change_requested") {
        if (client) {
          await storage.createNotification({
            clientId: updated.clientId,
            type: "meeting_change_requested",
            title: "Meeting Change Requested",
            message: "You've requested a meeting reschedule. Your broker will suggest a new time.",
          });
        }
      }

      if (client?.brokerUserId) {
        const statusLabel = response === "confirmed" ? "confirmed" : "requested a change for";
        sendPushToUser(client.brokerUserId, {
          title: `📅 ${client.name} ${statusLabel} your meeting`,
          body: "",
          url: "/broker",
          tag: "meeting-response-" + updated.id,
        }).catch(() => {});
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error responding to meeting:", error);
      res.status(500).json({ error: "Failed to respond to meeting" });
    }
  });

  // Get client enquiries (client view)
  app.get("/api/clients/:clientId/enquiries", requireAuth, async (req, res) => {
    try {
      const enquiries = await storage.getClientEnquiries(parseInt(req.params.clientId));
      res.json(enquiries);
    } catch (error) {
      console.error("Error fetching client enquiries:", error);
      res.status(500).json({ error: "Failed to fetch enquiries" });
    }
  });

  // Home Insurance Referral - creates notification for client
  app.post("/api/referrals/home-insurance", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") {
        return res.status(403).json({ error: "Only brokers can send referrals" });
      }
      
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Verify broker is assigned to this client
      if (client.brokerUserId !== req.session.userId) {
        return res.status(403).json({ error: "You can only send referrals to your own clients" });
      }
      
      // Create a referral notification for the client
      const notification = await storage.createNotification({
        clientId,
        type: "home_insurance_referral",
        title: "Protect your home with the right cover",
        message: "Your broker has sent you a Home Insurance offer. Get a quote from our trusted partner.",
        read: false,
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error sending home insurance referral:", error);
      res.status(500).json({ error: "Failed to send referral" });
    }
  });

  app.get("/api/push/vapid-key", (_req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }
      const subscription = await storage.savePushSubscription(
        req.session.userId!,
        endpoint,
        keys.p256dh,
        keys.auth
      );
      res.json({ success: true, id: subscription.id });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }
      await storage.removePushSubscription(req.session.userId!, endpoint);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  // Company routes
  app.get("/api/company/me", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company profile" });
    }
  });

  app.post("/api/company/logo", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const { logoUrl } = req.body;
      if (!logoUrl || typeof logoUrl !== 'string') {
        return res.status(400).json({ error: "Logo data is required" });
      }
      if (logoUrl.length > 2 * 1024 * 1024) {
        return res.status(400).json({ error: "Logo file too large (max 2MB)" });
      }
      const company = await storage.updateCompanyLogo(user.companyId, logoUrl);
      res.json(company);
    } catch (error) {
      console.error("Error updating company logo:", error);
      res.status(500).json({ error: "Failed to update logo" });
    }
  });

  app.get("/api/company/brokers", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const brokers = await storage.getBrokersByCompanyId(user.companyId);
      const brokersWithoutPasswords = brokers.map(({ password: _, ...b }) => b);
      res.json(brokersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brokers" });
    }
  });

  app.get("/api/company/stats", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const stats = await storage.getCompanyAggregateStats(user.companyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company stats" });
    }
  });

  app.get("/api/company/revenue-timeline", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const timeline = await storage.getCompanyRevenueTimeline(user.companyId);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue timeline" });
    }
  });

  app.get("/api/company/activity", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const activity = await storage.getCompanyActivity(user.companyId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company activity" });
    }
  });

  app.get("/api/company/leaderboard", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const leaderboard = await storage.getCompanyBrokerLeaderboard(user.companyId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker leaderboard" });
    }
  });

  app.get("/api/company/brokers/:brokerId/clients", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const broker = await storage.getUser(req.params.brokerId);
      if (!broker || broker.companyId !== user.companyId || broker.role !== "broker") {
        return res.status(403).json({ error: "Broker not in your company" });
      }
      const clients = await storage.getClientsByBrokerUserId(req.params.brokerId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker clients" });
    }
  });

  app.get("/api/company/brokers/:brokerId/commission", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const broker = await storage.getUser(req.params.brokerId);
      if (!broker || broker.companyId !== user.companyId || broker.role !== "broker") {
        return res.status(403).json({ error: "Broker not in your company" });
      }
      const commission = await storage.getBrokerCommission(req.params.brokerId);
      res.json(commission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker commission" });
    }
  });

  app.patch("/api/company/clients/:clientId/reassign", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ error: "Invalid client ID" });

      const { toBrokerUserId } = z.object({ toBrokerUserId: z.string().min(1) }).parse(req.body);

      const targetBroker = await storage.getUser(toBrokerUserId);
      if (!targetBroker || targetBroker.companyId !== user.companyId || targetBroker.role !== "broker") {
        return res.status(403).json({ error: "Target broker not in your company" });
      }

      const companyBrokers = await storage.getBrokersByCompanyId(user.companyId);
      const companyBrokerIds = new Set(companyBrokers.map(b => b.id));

      const client = await storage.getClient(clientId);
      if (!client || !client.brokerUserId || !companyBrokerIds.has(client.brokerUserId)) {
        return res.status(403).json({ error: "Client not in your company" });
      }
      if (client.brokerUserId === toBrokerUserId) {
        return res.status(400).json({ error: "Client is already assigned to this broker" });
      }

      const fromBroker = await storage.getUser(client.brokerUserId!);
      const updated = await storage.assignClientToBrokerWithLog(clientId, toBrokerUserId, {
        companyId: user.companyId!,
        clientId,
        clientName: client.name,
        fromBrokerUserId: client.brokerUserId!,
        fromBrokerName: fromBroker?.name ?? "Unknown",
        toBrokerUserId,
        toBrokerName: targetBroker.name,
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to reassign client" });
    }
  });

  app.patch("/api/company/clients/bulk-reassign", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const bodySchema = z.object({
        clientIds: z.array(z.number().int().positive()).min(1),
        toBrokerUserId: z.string().min(1),
      });
      const parsed = bodySchema.parse(req.body);
      const clientIds = Array.from(new Set(parsed.clientIds));
      const { toBrokerUserId } = parsed;

      const targetBroker = await storage.getUser(toBrokerUserId);
      if (!targetBroker || targetBroker.companyId !== user.companyId || targetBroker.role !== "broker") {
        return res.status(403).json({ error: "Target broker not in your company" });
      }

      const companyBrokers = await storage.getBrokersByCompanyId(user.companyId);
      const companyBrokerIds = new Set(companyBrokers.map(b => b.id));

      // Validate all clients and collect pre-reassignment data
      const clientsToReassign: { id: number; name: string; fromBrokerUserId: string; fromBrokerName: string }[] = [];
      for (const clientId of clientIds) {
        const client = await storage.getClient(clientId);
        if (!client || !client.brokerUserId || !companyBrokerIds.has(client.brokerUserId)) {
          return res.status(403).json({ error: `Client ${clientId} not in your company` });
        }
        if (client.brokerUserId === toBrokerUserId) {
          return res.status(400).json({ error: `Client ${clientId} is already assigned to this broker` });
        }
        const fromBroker = await storage.getUser(client.brokerUserId);
        clientsToReassign.push({
          id: clientId,
          name: client.name,
          fromBrokerUserId: client.brokerUserId,
          fromBrokerName: fromBroker?.name ?? "Unknown",
        });
      }

      // All validated — commit reassignments and audit log entries atomically
      const logEntries = clientsToReassign.map(c => ({
        companyId: user.companyId!,
        clientId: c.id,
        clientName: c.name,
        fromBrokerUserId: c.fromBrokerUserId,
        fromBrokerName: c.fromBrokerName,
        toBrokerUserId,
        toBrokerName: targetBroker!.name,
      }));
      await storage.bulkAssignClientsToBrokerWithLog(clientsToReassign, toBrokerUserId, logEntries);

      res.json({ reassigned: clientIds.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to reassign clients" });
    }
  });

  app.get("/api/company/reassignment-history", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const history = await storage.getReassignmentHistory(user.companyId, 100);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reassignment history" });
    }
  });

  app.get("/api/company/announcements", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const announcements = await storage.getCompanyAnnouncements(user.companyId);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/company/announcements", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const parsed = insertCompanyAnnouncementSchema.parse({
        ...req.body,
        companyId: user.companyId,
      });
      const announcement = await storage.createCompanyAnnouncement(parsed);
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.get("/api/company/messages", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const messages = await storage.getCompanyMessages(user.companyId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/company/messages", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const broker = await storage.getUser(req.body.brokerUserId);
      if (!broker || broker.companyId !== user.companyId || broker.role !== "broker") {
        return res.status(403).json({ error: "Broker not in your company" });
      }
      const parsed = insertCompanyMessageSchema.parse({
        ...req.body,
        companyId: user.companyId,
        senderType: "company",
      });
      const message = await storage.createCompanyMessage(parsed);
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/company/messages/:id/read", requireCompany, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: "Company profile not found" });
      }
      const message = await storage.markCompanyMessageRead(parseInt(req.params.id));
      if (!message || message.companyId !== user.companyId) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  app.get("/api/broker/company-announcements", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "broker" || !user.companyId) {
        return res.status(403).json({ error: "Not a broker with a company" });
      }
      const announcements = await storage.getCompanyAnnouncements(user.companyId);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.get("/api/broker/company-messages", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "broker" || !user.companyId) {
        return res.status(403).json({ error: "Not a broker with a company" });
      }
      const messages = await storage.getBrokerCompanyMessages(req.session.userId!, user.companyId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/broker/company-messages", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "broker" || !user.companyId) {
        return res.status(403).json({ error: "Not a broker with a company" });
      }
      const parsed = insertCompanyMessageSchema.parse({
        ...req.body,
        companyId: user.companyId,
        brokerUserId: req.session.userId!,
        senderType: "broker",
      });
      const message = await storage.createCompanyMessage(parsed);
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/broker/company-messages/:id/read", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "broker") {
        return res.status(403).json({ error: "Not a broker" });
      }
      const message = await storage.markCompanyMessageRead(parseInt(req.params.id));
      if (!message || message.brokerUserId !== req.session.userId) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Checklist endpoints
  app.get("/api/checklist/onboarding", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client not found" });

      const [items, completions] = await Promise.all([
        storage.getChecklistItems("onboarding"),
        storage.getChecklistCompletions(client.id, "onboarding"),
      ]);
      const completedIds = new Set(completions.map(c => c.itemId));
      res.json({
        items: items.map(item => ({ ...item, completed: completedIds.has(item.id) })),
        completedCount: completedIds.size,
        totalCount: items.length,
        pointsEarned: completions.reduce((sum, c) => {
          const item = items.find(i => i.id === c.itemId);
          return sum + (item?.points ?? 0);
        }, 0),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch onboarding checklist" });
    }
  });

  app.get("/api/checklist/current", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client not found" });

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [items, completions] = await Promise.all([
        storage.getChecklistItems(month),
        storage.getChecklistCompletions(client.id, month),
      ]);
      const completedIds = new Set(completions.map(c => c.itemId));
      res.json({
        month,
        items: items.map(item => ({ ...item, completed: completedIds.has(item.id) })),
        completedCount: completedIds.size,
        totalCount: items.length,
        pointsThisMonth: completions.reduce((sum, c) => {
          const item = items.find(i => i.id === c.itemId);
          return sum + (item?.points ?? 0);
        }, 0),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  app.post("/api/checklist/:itemId/complete", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client not found" });

      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) return res.status(400).json({ error: "Invalid item ID" });

      const completion = await storage.completeChecklistItem(client.id, itemId);
      const totalPoints = await storage.getClientTotalPoints(client.id);
      res.json({ completion, totalPoints });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete checklist item" });
    }
  });

  app.get("/api/client/points", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") {
        return res.status(403).json({ error: "Client access required" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client not found" });

      const totalPoints = await storage.getClientTotalPoints(client.id);
      res.json({ totalPoints });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  // ── Gift Card endpoints ────────────────────────────────────────────────────

  // Admin: upload codes
  app.post("/api/admin/gift-cards/upload", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { brandKey, brandLabel, faceValue, pointsCost, codes } = req.body;
      if (!brandKey || !brandLabel || !faceValue || !pointsCost || !Array.isArray(codes) || codes.length === 0)
        return res.status(400).json({ error: "brandKey, brandLabel, faceValue, pointsCost and codes[] required" });
      const parsed = codes
        .map((raw: string) => {
          const parts = raw.trim().split(/[\t,]/);
          return { code: parts[0]?.trim(), pin: parts[1]?.trim() || undefined };
        })
        .filter(c => c.code);
      const count = await storage.uploadGiftCards(brandKey, brandLabel, Number(faceValue), Number(pointsCost), parsed);
      res.json({ inserted: count });
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Admin: stock overview
  app.get("/api/admin/gift-cards/stock", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const stock = await storage.getGiftCardStock();
      res.json(stock);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  // Client: redeem a gift card
  app.post("/api/rewards/redeem/:brandKey", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client not found" });

      const { pointsCost } = req.body;
      if (!pointsCost || isNaN(Number(pointsCost))) return res.status(400).json({ error: "pointsCost required" });

      const balance = await storage.getClientTotalPoints(client.id);
      if (balance < Number(pointsCost)) return res.status(400).json({ error: "INSUFFICIENT_POINTS" });

      try {
        const card = await storage.claimGiftCard(req.params.brandKey, client.id, Number(pointsCost));
        const newBalance = await storage.getClientTotalPoints(client.id);
        res.json({ card, newBalance });
      } catch (e: any) {
        if (e.message === "OUT_OF_STOCK") return res.status(409).json({ error: "OUT_OF_STOCK" });
        throw e;
      }
    } catch (err) {
      res.status(500).json({ error: "Redemption failed" });
    }
  });

  // Admin: get brand codes for editing
  app.get("/api/admin/gift-cards/brand/:brandKey", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const codes = await storage.getGiftCardBrandCodes(req.params.brandKey);
      res.json(codes);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch brand codes" });
    }
  });

  // Admin: update brand config + add more codes
  app.patch("/api/admin/gift-cards/brand/:brandKey", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { brandLabel, faceValue, pointsCost, newCodes = [] } = req.body;
      if (!brandLabel || !faceValue || !pointsCost)
        return res.status(400).json({ error: "brandLabel, faceValue, pointsCost required" });
      const parsed = (newCodes as string[])
        .map((raw: string) => {
          const parts = raw.trim().split(/[\t,]/);
          return { code: parts[0]?.trim(), pin: parts[1]?.trim() || undefined };
        })
        .filter(c => c.code);
      const result = await storage.updateGiftCardBrand(req.params.brandKey, brandLabel, Number(faceValue), Number(pointsCost), parsed);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  // Admin: toggle brand enabled/disabled
  app.patch("/api/admin/gift-cards/brand/:brandKey/toggle", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") return res.status(400).json({ error: "enabled (boolean) required" });
      await storage.toggleGiftCardBrand(req.params.brandKey, enabled);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Toggle failed" });
    }
  });

  // Client: view redeemed cards
  app.get("/api/client/redeemed-cards", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Client not found" });
      const cards = await storage.getClientRedeemedCards(client.id);
      res.json(cards);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch redeemed cards" });
    }
  });

  // ─── Admin: Prize Draws ────────────────────────────────────────────────────
  app.get("/api/admin/prize-draws", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const draws = await storage.listPrizeDraws();
      res.json(draws);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/prize-draws", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { title, description, prize, pointsPerEntry, maxEntriesPerClient, drawDate } = req.body;
      if (!title?.trim() || !prize?.trim() || !pointsPerEntry) return res.status(400).json({ error: "title, prize, pointsPerEntry required" });
      const draw = await storage.createPrizeDraw({
        title: title.trim(),
        description: description?.trim() || null,
        prize: prize.trim(),
        pointsPerEntry: Number(pointsPerEntry),
        maxEntriesPerClient: maxEntriesPerClient ? Number(maxEntriesPerClient) : null,
        drawDate: drawDate ? new Date(drawDate) : null,
        status: "active",
      });
      res.json(draw);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.patch("/api/admin/prize-draws/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const id = parseInt(req.params.id);
      const updated = await storage.updatePrizeDraw(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.get("/api/admin/prize-draws/:id/entries", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const entries = await storage.getDrawEntries(parseInt(req.params.id));
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/prize-draws/:id/pick-winner", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const draw = await storage.getPrizeDraw(parseInt(req.params.id));
      if (!draw) return res.status(404).json({ error: "Not found" });
      if (draw.status !== 'active' && draw.status !== 'closed') return res.status(400).json({ error: "Draw must be active or closed to pick a winner" });
      const result = await storage.pickDrawWinner(parseInt(req.params.id));
      if (!result) return res.status(400).json({ error: "No entries in this draw" });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/prize-draws/:id/close", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const updated = await storage.updatePrizeDraw(parseInt(req.params.id), { status: 'closed' });
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/prize-draws/:id/notify-winner", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const draw = await storage.getPrizeDraw(parseInt(req.params.id));
      if (!draw) return res.status(404).json({ error: "Not found" });
      if (draw.status !== 'drawn') return res.status(400).json({ error: "Draw must have a winner selected first" });
      if (draw.winnerNotified) return res.status(400).json({ error: "Winner already notified" });
      if (!draw.winnerEntryId) return res.status(400).json({ error: "No winner selected" });
      const entries = await storage.getDrawEntries(draw.id);
      const winnerEntry = entries.find(e => e.id === draw.winnerEntryId);
      if (winnerEntry) {
        await storage.createNotification({
          clientId: winnerEntry.clientId,
          type: "prize_draw_winner",
          title: `You won the ${draw.title}! 🏆`,
          message: `Congratulations! You've won ${draw.prize}. Your broker will be in touch to arrange delivery.`,
          read: false,
        });
      }
      const updated = await storage.updatePrizeDraw(draw.id, { winnerNotified: true });
      res.json({ success: true, notified: true, draw: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to notify winner" });
    }
  });

  // ─── Admin: Charities ─────────────────────────────────────────────────────
  app.get("/api/admin/charities", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const charities = await storage.listCharities();
      res.json(charities);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/charities", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { name, description, logoUrl, pointsPerPound } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "name required" });
      const charity = await storage.createCharity({
        name: name.trim(),
        description: description?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        pointsPerPound: Number(pointsPerPound) || 100,
        status: "active",
      });
      res.json(charity);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.patch("/api/admin/charities/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const updated = await storage.updateCharity(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.get("/api/admin/charity-donations", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const [donations, totals] = await Promise.all([
        storage.listAllDonations(),
        storage.getCharityDonationTotals(),
      ]);
      res.json({ donations, totals });
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/charities/:id/mark-fulfilled", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const count = await storage.markDonationsFulfilled(parseInt(req.params.id));
      res.json({ count });
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  // ─── Client: Prize Draws ───────────────────────────────────────────────────
  app.get("/api/client/prize-draws/active", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Not found" });
      const draw = await storage.getActivePrizeDraw();
      if (!draw) return res.json(null);
      const myEntries = await storage.getClientDrawEntries(draw.id, client.id);
      res.json({ ...draw, myEntries });
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/client/prize-draws/:id/enter", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Not found" });
      const { numEntries } = req.body;
      if (!numEntries || numEntries < 1) return res.status(400).json({ error: "numEntries must be >= 1" });
      const entry = await storage.enterPrizeDraw(parseInt(req.params.id), client.id, Number(numEntries));
      const newBalance = await storage.getClientTotalPoints(client.id);
      res.json({ entryId: entry.id, numEntries: entry.numEntries, pointsSpent: entry.pointsSpent, drawId: entry.drawId, newBalance });
    } catch (err: any) {
      const code = err.code || "FAILED";
      res.status(code === 'INSUFFICIENT_POINTS' ? 400 : code === 'MAX_ENTRIES_EXCEEDED' ? 400 : code === 'DRAW_NOT_ACTIVE' ? 400 : 500).json({ error: err.message, code });
    }
  });

  // ─── Client: Charities ─────────────────────────────────────────────────────
  app.get("/api/client/charities", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const charities = await storage.listCharities(true);
      res.json(charities);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/client/charities/:id/donate", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Not found" });
      const { pointsDonated } = req.body;
      if (!pointsDonated || pointsDonated < 1) return res.status(400).json({ error: "pointsDonated must be >= 1" });
      const donation = await storage.donateToCharity(parseInt(req.params.id), client.id, Number(pointsDonated));
      const newBalance = await storage.getClientTotalPoints(client.id);
      res.json({ donationId: donation.id, pointsDonated: donation.pointsDonated, poundValue: donation.poundValue, charityName: donation.charityName, status: donation.status, newBalance });
    } catch (err: any) {
      const code = err.code || "FAILED";
      res.status(code === 'INSUFFICIENT_POINTS' ? 400 : code === 'CHARITY_UNAVAILABLE' ? 400 : 500).json({ error: err.message, code });
    }
  });

  app.get("/api/client/my-donations", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Not found" });
      const donations = await storage.getClientDonations(client.id);
      res.json(donations);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  // ── Broker Reward Credits ────────────────────────────────────────────────────
  const CREDIT_PACKS: Record<string, { credits: number; amountGbp: number; label: string }> = {
    "1":  { credits: 1,  amountGbp: 5,  label: "1 credit pack" },
    "5":  { credits: 5,  amountGbp: 25, label: "5 credit pack" },
    "10": { credits: 10, amountGbp: 50, label: "10 credit pack" },
  };

  app.get("/api/broker/reward-credits", async (req, res) => {
    if (!req.session.userId || req.session.role !== "broker") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json({ credits: user.rewardCredits ?? 0 });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch credits" });
    }
  });

  app.post("/api/billing/reward-credits/checkout", async (req, res) => {
    const user = await requireBroker(req, res);
    if (!user) return;
    try {
      const packKey = String(req.body?.pack ?? "");
      const pack = CREDIT_PACKS[packKey];
      if (!pack) return res.status(400).json({ error: "Invalid pack. Choose '1', '5', or '10'." });

      const stripe = await getUncachableStripeClient();
      const origin = `${req.protocol}://${req.get("host")}`;

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
      }

      // Resolve pre-seeded price ID from Stripe (run scripts/seed-reward-credit-products.ts).
      // Falls back to inline price_data if the seed hasn't been run yet.
      const seededPriceId = await storage.getPriceIdForCreditPack(pack.credits);
      const lineItem = seededPriceId
        ? { price: seededPriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: pack.amountGbp * 100,
              product_data: {
                name: `Uprosper Reward Credits — ${pack.label}`,
                description: `${pack.credits} gift card credit${pack.credits > 1 ? "s" : ""} (£5 each) to send to your clients`,
                metadata: { type: "reward_credit_pack", credits: String(pack.credits) },
              },
            },
          };

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [lineItem],
        metadata: {
          type: "reward_credits",
          credits: String(pack.credits),
          brokerUserId: user.id,
        },
        success_url: `${origin}/broker?credits=success&qty=${pack.credits}`,
        cancel_url: `${origin}/broker?credits=cancelled`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[billing/reward-credits/checkout]", err);
      res.status(500).json({ error: err?.message || "Checkout failed" });
    }
  });

  // ── Broker Sent Rewards ──────────────────────────────────────────────────────
  const VALID_BROKER_REWARD_BRANDS = ["amazon", "starbucks", "marks-and-spencer"];

  app.get("/api/broker/sent-rewards", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") return res.status(403).json({ error: "Broker access required" });
      const rewards = await storage.getBrokerSentRewards(req.session.userId!);
      res.json(rewards);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  app.post("/api/broker/sent-rewards", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "broker") return res.status(403).json({ error: "Broker access required" });
      const { clientId, brand } = req.body;
      if (!clientId || typeof clientId !== "number") return res.status(400).json({ error: "clientId required" });
      if (!brand || !VALID_BROKER_REWARD_BRANDS.includes(brand)) return res.status(400).json({ error: "Invalid brand" });
      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ error: "Client not found" });
      if (client.brokerUserId !== req.session.userId) return res.status(403).json({ error: "Not your client" });
      const result = await storage.createBrokerSentRewardAndDeductCredit(
        req.session.userId!,
        clientId,
        brand,
        "5.00",
      );
      if ("error" in result) {
        return res.status(402).json({ error: "Insufficient credits" });
      }
      res.status(201).json({ ...result.reward, creditsRemaining: result.creditsRemaining });
    } catch (err) {
      res.status(500).json({ error: "Failed to send reward" });
    }
  });

  app.get("/api/client/broker-rewards", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "client") return res.status(403).json({ error: "Client access required" });
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Not found" });
      const client = await storage.getClientByEmail(user.email);
      if (!client) return res.status(404).json({ error: "Not found" });
      const rewards = await storage.getClientBrokerRewards(client.id);
      res.json(rewards);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.get("/api/admin/broker-sent-rewards", requireAdmin, async (req, res) => {
    try {
      const rewards = await storage.getAllBrokerSentRewards();
      res.json(rewards);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.patch("/api/admin/broker-sent-rewards/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      if (!status || !["pending", "sent", "fulfilled"].includes(status)) return res.status(400).json({ error: "Invalid status" });
      const updated = await storage.updateBrokerSentRewardStatus(id, status);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  return httpServer;
}
