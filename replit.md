# Uprosper - Client Retention & Wealth Platform

## Overview

Uprosper is a financial services platform designed for mortgage brokers to manage client relationships and retention. The application has a public landing page at `/` targeting end clients, with the authenticated app behind login. It provides three tiers of dashboards: a client-facing app (`/client`) for tracking financial journeys/rewards/offers, a broker dashboard (`/broker`) for managing client portfolios, and a company dashboard (`/company`) for broker companies to manage their teams and track aggregate performance. The platform gamifies the mortgage and wealth planning experience with a "prosperity journey" that unlocks rewards as clients progress through financial milestones. A 10-slide investor pitch deck is available at `/pitch/1` through `/pitch/10` (Title, Problem, Solution, Market, Competition, Product, Income Model, Roadmap, Team, Ask) with an appendix at `/pitch/11` (Sources). A 21-page business plan is available at `/plan/1` through `/plan/21` (Cover, Problem, Broken Lifecycle, Opportunity, Solution, User Journey, Product, Homeownership Journey, Rewards & Engagement, Revenue Model, Unit Economics, Market Size, Traction, Go-To-Market, Competitive Landscape, Why We Win, Compliance, Product Roadmap, Long-Term Vision, Exit Opportunity, The Ask).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS v4 with CSS variables for theming (forest green color scheme)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for UI animations
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API with JSON responses
- **Development**: tsx for TypeScript execution without compilation

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Authentication System
- **Password Hashing**: bcryptjs for secure password storage
- **Sessions**: express-session with PostgreSQL store (connect-pg-simple)
- **Roles**: Three user roles - client, broker, admin
- **Public signup**: Creates client users only
- **Admin-only user creation**: Admins can create broker/admin users via POST /api/admin/users

### Key Data Models
- **Users**: Authentication records with email, password (hashed), name, dateOfBirth, role, createdAt
- **Sessions**: Session storage table for persistent login sessions
- **Clients**: Mortgage client profiles with status, mortgage value, mortgage term (years), renewal dates, and reviewedByBroker flag for one-time review popup
- **Journey Steps**: Financial milestones in a client's prosperity journey
- **Rewards**: Claimable rewards tied to journey progress
- **Offers**: Personalized financial product offers
- **Notifications**: Client communication history
- **Affiliate Deals**: DB-backed affiliate marketplace deals (`affiliate_deals` table) with id, storeName, category, tab (homeware|leisure), iconKey, logo, copy, cashback, expiry, accent colors, trackingUrl, status, sortOrder. Admins manage via the "Manage" pill on the Affiliate marketplace tile in `/admin`. Public client view comes from `GET /api/marketplace/deals` (sanitized — tracking URLs stripped). Click-through endpoint `/api/marketplace/click/:dealId` resolves the redirect URL from the DB.
- **Company Announcements**: One-way broadcasts from company to all brokers (title, content, priority)
- **Company Messages**: Two-way direct messages between company and individual brokers (senderType: company|broker)

### Project Structure
```
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/   # UI components including shadcn/ui, walkthrough-tutorial
│   │   ├── pages/        # Route pages (landing, client, broker dashboards)
│   │   ├── lib/          # Utilities, API client, query client
│   │   └── hooks/        # Custom React hooks
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── seed.ts       # Sample data seeding
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle database schema and Zod validators
```

### API Structure
All API endpoints are prefixed with `/api`:

**Authentication:**
- `POST /api/auth/signup` - Register new client user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current authenticated user

**Admin (requires admin role):**
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/clients` - List client users
- `GET /api/admin/users/brokers` - List broker users
- `GET /api/admin/stats` - User statistics
- `POST /api/admin/users` - Create user with any role

**Company (requires company role):**
- `GET /api/company/me` - Get company profile
- `GET /api/company/brokers` - List company's brokers
- `GET /api/company/stats` - Aggregate company stats (brokers, clients, revenue, retention, monthlyBreakdown, companySplit)
- `GET /api/company/revenue-timeline` - Daily revenue data points for charts (date + revenue per day)
- `GET /api/company/activity` - Recent activity feed across all brokers
- `GET /api/company/leaderboard` - Broker leaderboard ranked by performance
- `GET /api/company/brokers/:brokerId/clients` - Specific broker's client list
- `GET /api/company/brokers/:brokerId/commission` - Specific broker's commission data
- `GET /api/company/announcements` - List company announcements
- `POST /api/company/announcements` - Create a new announcement
- `GET /api/company/messages` - List all company-broker messages
- `POST /api/company/messages` - Send message to a broker
- `POST /api/company/messages/:id/read` - Mark message as read

**Broker (company communication):**
- `GET /api/broker/company-announcements` - Get announcements from broker's company
- `GET /api/broker/company-messages` - Get messages between broker and company
- `POST /api/broker/company-messages` - Send message to company
- `POST /api/broker/company-messages/:id/read` - Mark message as read

**Affiliate Marketplace (admin requires admin role):**
- `GET /api/marketplace/deals` - Public list of active deals (tracking URLs stripped)
- `GET /api/admin/affiliate-deals` - All deals incl. inactive + 7d/30d click counts
- `POST /api/admin/affiliate-deals` - Create new deal
- `PATCH /api/admin/affiliate-deals/:id` - Update fields incl. trackingUrl
- `DELETE /api/admin/affiliate-deals/:id` - Remove a deal

**Client Management:**
- `GET/POST /api/clients` - Client management
- `GET/PATCH /api/clients/:id` - Individual client operations
- `PATCH /api/clients/:id/review` - Mark client as reviewed with mortgage details
- `GET /api/clients/:id/journey` - Client journey steps
- `GET /api/clients/:id/rewards` - Client rewards
- `GET /api/clients/:id/offers` - Client offers
- `GET /api/clients/:id/notifications` - Client notifications
- `POST /api/rewards/:id/claim` - Claim a reward

### Billing (Stripe)
- **Integration**: Replit Stripe connector (`server/stripeClient.ts`) — credentials fetched from `REPLIT_CONNECTORS_HOSTNAME`, never hardcoded.
- **Source of truth for pricing**: Stripe metadata. Products are created by `scripts/seed-products.ts` (idempotent) with `metadata.plan` (`starter` / `growth`) and `metadata.band` (`1`/`2`/`3` for Growth). Server resolves `{plan, band} → price.id` via SQL on the synced `stripe.prices`/`stripe.products` schema (no env vars for price IDs).
- **Sync**: `stripe-replit-sync` mirrors Stripe data into the local `stripe` schema. Init runs in `server/index.ts` (migrations + managed webhook + `syncBackfill`, all wrapped in try/catch and non-blocking).
- **Webhook**: `POST /api/stripe/webhook` registered with `express.raw` BEFORE `express.json`. Handler in `server/webhookHandlers.ts` forwards to `stripe-replit-sync` for signature verification + sync, then applies app-side updates to the `users` row (plan, growthBand, subscriptionStatus, stripeSubscriptionId) on `customer.subscription.*` events. Webhook is the source of truth — client redirects are UX only.
- **Plans**: Starter £20/mo, Growth £50 / £75 / £100/mo (bands 1/2/3), all GBP monthly with 14-day trial. Enterprise stays Calendly only (no checkout).
- **Endpoints**: `POST /api/billing/checkout` (creates Customer if missing, returns Checkout Session URL); `POST /api/billing/portal` (returns Stripe Billing Portal URL); `POST /api/billing/reward-credits/checkout` (broker-only, body `{pack:'1'|'5'|'10'}`, returns Checkout Session URL for one-time credit pack purchase — 1 credit £5, 5 credits £25, 10 credits £50).
- **Reward Credits**: Broker wallet (`users.reward_credits`). Seeder: `npx tsx scripts/seed-reward-credit-products.ts` (idempotent, creates Stripe products with `metadata.type=reward_credit_pack` + `metadata.credits`). Webhook `checkout.session.completed` reads product metadata to derive credits (session metadata fallback). Send-reward route uses atomic DB transaction to deduct credit + insert row. Send buttons disabled when wallet is empty. Admin broker-rewards table shows Credits column per row.
- **User columns**: `stripeCustomerId`, `stripeSubscriptionId`, `plan`, `growthBand`, `subscriptionStatus` on `users` (idempotent ALTERs in `server/index.ts`).
- **Re-seed**: `npx tsx scripts/seed-products.ts` (safe to re-run; updates metadata, never duplicates).
- **Live-test promo**: `npx tsx scripts/create-test-promo.ts` creates the `LIVETEST` promotion code (99.5% off, once, max 5 redemptions). Enter at Stripe Checkout → "Add promotion code" to drop any plan to ~0.5% of price for end-to-end live testing.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with automatic schema inference
- **drizzle-zod**: Generates Zod validation schemas from Drizzle tables

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives (dialogs, dropdowns, tabs, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **Framer Motion**: Animation library
- **date-fns**: Date formatting utilities

### Development Tools
- **Vite**: Frontend build tool with HMR
- **Tailwind CSS v4**: Utility-first CSS framework
- **TypeScript**: Type checking across the full stack

### Fonts
- **Google Fonts**: Outfit (headings) and DM Sans (body text) loaded via CDN