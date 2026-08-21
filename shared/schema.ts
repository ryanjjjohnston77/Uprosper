import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyCode: varchar("company_code", { length: 8 }).notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  role: text("role").notNull().default("client"),
  brokerCode: varchar("broker_code", { length: 6 }).unique(),
  companyId: integer("company_id"),
  calendarUrl: text("calendar_url"),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  lastActiveAt: timestamp("last_active_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  growthBand: integer("growth_band"),
  subscriptionStatus: text("subscription_status"),
  rewardCredits: integer("reward_credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  status: text("status").notNull().default("Active"),
  mortgageValue: decimal("mortgage_value", { precision: 10, scale: 2 }).notNull(),
  mortgageTerm: integer("mortgage_term"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 3 }),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }),
  renewalDate: text("renewal_date").notNull(),
  lastContact: timestamp("last_contact").defaultNow(),
  brokerId: integer("broker_id"),
  brokerUserId: text("broker_user_id"),
  referralCode: varchar("referral_code", { length: 10 }).unique(),
  referredByClientId: integer("referred_by_client_id"),
  reviewedByBroker: boolean("reviewed_by_broker").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerClientId: integer("referrer_client_id").notNull().references(() => clients.id),
  referredClientId: integer("referred_client_id").notNull().references(() => clients.id),
  status: text("status").notNull().default("pending"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).default("0"),
  rewardPaid: boolean("reward_paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journeySteps = pgTable("journey_steps", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  stepId: integer("step_id").notNull(),
  stepTitle: text("step_title").notNull(),
  status: text("status").notNull().default("locked"),
  completedAt: timestamp("completed_at"),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  expiresAt: timestamp("expires_at"),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: text("value"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentReminders = pgTable("payment_reminders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id).unique(),
  dayOfMonth: integer("day_of_month").notNull(),
  customMessage: text("custom_message"),
  enabled: boolean("enabled").notNull().default(true),
  lastSentForDate: date("last_sent_for_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  brokerUserId: text("broker_user_id").notNull(),
  senderType: text("sender_type").notNull().default("client"),
  messageType: text("message_type").notNull().default("message"),
  subject: text("subject"),
  content: text("content").notNull(),
  meetingLink: text("meeting_link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  brokerUserId: text("broker_user_id").notNull(),
  productType: text("product_type").notNull(),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  read: boolean("read").notNull().default(false),
  meetingDate: text("meeting_date"),
  meetingTime: text("meeting_time"),
  meetingStatus: text("meeting_status"),
  meetingLink: text("meeting_link"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  reminder2MinSent: boolean("reminder_2min_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brokerNotifications = pgTable("broker_notifications", {
  id: serial("id").primaryKey(),
  brokerUserId: text("broker_user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  enquiryId: integer("enquiry_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: serial("id").primaryKey(),
  brokerUserId: text("broker_user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companyAnnouncements = pgTable("company_announcements", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companyMessages = pgTable("company_messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  brokerUserId: text("broker_user_id").notNull(),
  senderType: text("sender_type").notNull().default("company"),
  subject: text("subject"),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewardQueue = pgTable("reward_queue", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  stepId: integer("step_id").notNull(),
  stepTitle: text("step_title").notNull(),
  status: text("status").notNull().default("pending"),
  qrCodeData: text("qr_code_data"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRewardQueueSchema = createInsertSchema(rewardQueue).omit({ id: true, createdAt: true });

export const clientAppointments = pgTable("client_appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  brokerUserId: text("broker_user_id").notNull(),
  meetingDate: text("meeting_date").notNull(),
  meetingTime: text("meeting_time").notNull(),
  remindAt: timestamp("remind_at"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientAppointmentSchema = createInsertSchema(clientAppointments).omit({ id: true, createdAt: true, reminderSent: true });

export const engagementEvents = pgTable("engagement_events", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEngagementEventSchema = createInsertSchema(engagementEvents).omit({ id: true, createdAt: true });

export const marketplaceClicks = pgTable("marketplace_clicks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  brokerUserId: text("broker_user_id").references(() => users.id),
  dealId: text("deal_id").notNull(),
  sid: text("sid").notNull(),
  userAgent: text("user_agent"),
  referer: text("referer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMarketplaceClickSchema = createInsertSchema(marketplaceClicks).omit({ id: true, createdAt: true });
export type MarketplaceClick = typeof marketplaceClicks.$inferSelect;
export type InsertMarketplaceClick = z.infer<typeof insertMarketplaceClickSchema>;

export const affiliateDealsTable = pgTable("affiliate_deals", {
  id: text("id").primaryKey(),
  storeName: text("store_name").notNull(),
  category: text("category").notNull(),
  tab: text("tab").notNull(),
  iconKey: text("icon_key").notNull().default("ShoppingBag"),
  logoUrl: text("logo_url").notNull().default(""),
  logoFallback: text("logo_fallback").notNull().default("🛍️"),
  dealTitle: text("deal_title").notNull(),
  dealDescription: text("deal_description").notNull(),
  discountCode: text("discount_code"),
  cashbackRate: text("cashback_rate").notNull().default(""),
  expiryDate: text("expiry_date").notNull().default(""),
  accentColor: text("accent_color").notNull().default("#44ba84"),
  accentBg: text("accent_bg").notNull().default("rgba(68,186,132,0.08)"),
  trackingUrl: text("tracking_url").notNull(),
  status: text("status").notNull().default("active"),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAffiliateDealSchema = createInsertSchema(affiliateDealsTable).omit({ updatedAt: true });
export const updateAffiliateDealSchema = insertAffiliateDealSchema.partial().omit({ id: true });
export type AffiliateDealRow = typeof affiliateDealsTable.$inferSelect;
export type InsertAffiliateDeal = z.infer<typeof insertAffiliateDealSchema>;
export type UpdateAffiliateDeal = z.infer<typeof updateAffiliateDealSchema>;

export const clientReassignmentLog = pgTable("client_reassignment_log", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  clientName: text("client_name").notNull(),
  fromBrokerUserId: text("from_broker_user_id").notNull(),
  fromBrokerName: text("from_broker_name").notNull(),
  toBrokerUserId: text("to_broker_user_id").notNull(),
  toBrokerName: text("to_broker_name").notNull(),
  reassignedAt: timestamp("reassigned_at").defaultNow().notNull(),
});

export const insertClientReassignmentLogSchema = createInsertSchema(clientReassignmentLog).omit({ id: true, reassignedAt: true });
export type ClientReassignmentLog = typeof clientReassignmentLog.$inferSelect;
export type InsertClientReassignmentLog = z.infer<typeof insertClientReassignmentLogSchema>;

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  month: varchar("month", { length: 7 }).notNull(),
  title: text("title").notNull(),
  points: integer("points").notNull().default(10),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const checklistCompletions = pgTable("checklist_completions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  itemId: integer("item_id").notNull().references(() => checklistItems.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({ id: true });
export const insertChecklistCompletionSchema = createInsertSchema(checklistCompletions).omit({ id: true, completedAt: true });
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

export const ENGAGEMENT_EVENT_TYPES = [
  "calculator_run",
  "mortgage_option_viewed",
  "lesson_viewed",
  "marketplace_view",
] as const;

export const createEngagementEventRequestSchema = z.object({
  eventType: z.enum(ENGAGEMENT_EVENT_TYPES),
  metadata: z.record(z.any()).optional().nullable(),
});

export const createClientAppointmentRequestSchema = z.object({
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  meetingTime: z.string().regex(/^\d{1,2}:\d{2}$/, "Invalid time"),
  addReminder: z.boolean().optional().default(false),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  dateOfBirth: z.string(),
  role: z.enum(["client", "broker", "admin", "company"]).optional().default("client"),
  brokerCode: z.string().length(6).optional(),
  referralCode: z.string().optional(),
  companyCode: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy and Terms" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  calendarUrl: z.string().url().or(z.literal("")).nullable().optional(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertJourneyStepSchema = createInsertSchema(journeySteps).omit({ id: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertPaymentReminderSchema = createInsertSchema(paymentReminders).omit({ id: true, createdAt: true, updatedAt: true, lastSentForDate: true });
export const updatePaymentReminderSchema = z.object({
  enabled: z.boolean().optional(),
  dayOfMonth: z.coerce.number().int().min(1).max(28).optional(),
  customMessage: z.string().max(280).optional().nullable(),
});
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertEnquirySchema = createInsertSchema(enquiries).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({ id: true, requestedAt: true });
export const insertBrokerNotificationSchema = createInsertSchema(brokerNotifications).omit({ id: true, createdAt: true });
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export const insertCompanyAnnouncementSchema = createInsertSchema(companyAnnouncements).omit({ id: true, createdAt: true });
export const insertCompanyMessageSchema = createInsertSchema(companyMessages).omit({ id: true, createdAt: true });

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export const reviewClientSchema = z.object({
  mortgageValue: z.string().optional(),
  mortgageTerm: z.coerce.number().int().min(1).max(40).optional(),
  interestRate: z.coerce.number().min(0).max(25).optional().transform((v) => (v === undefined ? undefined : v.toString())),
  renewalDate: z.string().optional(),
});

export const updateClientSchema = z.object({
  status: z.enum(["Active", "Inactive"]).optional(),
  mortgageValue: z.string().min(1).optional(),
  mortgageTerm: z.coerce.number().int().min(1).max(40).optional(),
  interestRate: z.union([
    z.literal(""),
    z.coerce.number().min(0).max(25),
  ]).optional().transform((v) => {
    if (v === undefined) return undefined;
    if (v === "") return null;
    return v.toString();
  }),
  monthlyPayment: z.union([
    z.literal(""),
    z.coerce.number().min(0).max(1_000_000),
  ]).optional().transform((v) => {
    if (v === undefined) return undefined;
    if (v === "") return null;
    return v.toString();
  }),
  renewalDate: z.string().min(1).optional(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type JourneyStep = typeof journeySteps.$inferSelect;
export type InsertJourneyStep = z.infer<typeof insertJourneyStepSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type PaymentReminder = typeof paymentReminders.$inferSelect;
export type InsertPaymentReminder = z.infer<typeof insertPaymentReminderSchema>;
export type UpdatePaymentReminder = z.infer<typeof updatePaymentReminderSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;
export type BrokerNotification = typeof brokerNotifications.$inferSelect;
export type InsertBrokerNotification = z.infer<typeof insertBrokerNotificationSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type CompanyAnnouncement = typeof companyAnnouncements.$inferSelect;
export type InsertCompanyAnnouncement = z.infer<typeof insertCompanyAnnouncementSchema>;
export type CompanyMessage = typeof companyMessages.$inferSelect;
export type InsertCompanyMessage = z.infer<typeof insertCompanyMessageSchema>;
export type RewardQueueItem = typeof rewardQueue.$inferSelect;
export type InsertRewardQueueItem = z.infer<typeof insertRewardQueueSchema>;
export type ClientAppointment = typeof clientAppointments.$inferSelect;
export type InsertClientAppointment = z.infer<typeof insertClientAppointmentSchema>;
export type CreateClientAppointmentRequest = z.infer<typeof createClientAppointmentRequestSchema>;
export type EngagementEvent = typeof engagementEvents.$inferSelect;
export type InsertEngagementEvent = z.infer<typeof insertEngagementEventSchema>;
export type CreateEngagementEventRequest = z.infer<typeof createEngagementEventRequestSchema>;

// ── Gift Card Redemption System ──────────────────────────────────────────────
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  brandKey: varchar("brand_key", { length: 50 }).notNull(),
  brandLabel: varchar("brand_label", { length: 100 }).notNull(),
  faceValue: decimal("face_value", { precision: 8, scale: 2 }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  code: text("code").notNull(),
  pin: varchar("pin", { length: 50 }),
  redeemedByClientId: integer("redeemed_by_client_id").references(() => clients.id),
  redeemedAt: timestamp("redeemed_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const pointRedemptions = pgTable("point_redemptions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  giftCardId: integer("gift_card_id").notNull().references(() => giftCards.id),
  pointsSpent: integer("points_spent").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({ id: true, uploadedAt: true, redeemedByClientId: true, redeemedAt: true });
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type PointRedemption = typeof pointRedemptions.$inferSelect;

export const prizeDraws = pgTable("prize_draws", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  prize: text("prize").notNull(),
  pointsPerEntry: integer("points_per_entry").notNull(),
  maxEntriesPerClient: integer("max_entries_per_client"),
  drawDate: timestamp("draw_date"),
  status: text("status").notNull().default("active"),
  winnerEntryId: integer("winner_entry_id"),
  winnerNotified: boolean("winner_notified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prizeDrawEntries = pgTable("prize_draw_entries", {
  id: serial("id").primaryKey(),
  drawId: integer("draw_id").notNull().references(() => prizeDraws.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  numEntries: integer("num_entries").notNull().default(1),
  pointsSpent: integer("points_spent").notNull(),
  enteredAt: timestamp("entered_at").defaultNow().notNull(),
});

export const charities = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  pointsPerPound: integer("points_per_pound").notNull().default(100),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const charityDonations = pgTable("charity_donations", {
  id: serial("id").primaryKey(),
  charityId: integer("charity_id").notNull().references(() => charities.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  pointsDonated: integer("points_donated").notNull(),
  poundValue: decimal("pound_value", { precision: 8, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  donatedAt: timestamp("donated_at").defaultNow().notNull(),
});

export const insertPrizeDrawSchema = createInsertSchema(prizeDraws).omit({ id: true, createdAt: true, winnerEntryId: true, winnerNotified: true });
export type PrizeDraw = typeof prizeDraws.$inferSelect;
export type InsertPrizeDraw = z.infer<typeof insertPrizeDrawSchema>;
export const insertPrizeDrawEntrySchema = createInsertSchema(prizeDrawEntries).omit({ id: true, enteredAt: true });
export type PrizeDrawEntry = typeof prizeDrawEntries.$inferSelect;
export type InsertPrizeDrawEntry = z.infer<typeof insertPrizeDrawEntrySchema>;
export const insertCharitySchema = createInsertSchema(charities).omit({ id: true, createdAt: true });
export type Charity = typeof charities.$inferSelect;
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export const insertCharityDonationSchema = createInsertSchema(charityDonations).omit({ id: true, donatedAt: true });
export type CharityDonation = typeof charityDonations.$inferSelect;
export type InsertCharityDonation = z.infer<typeof insertCharityDonationSchema>;

export const brokerSentRewards = pgTable("broker_sent_rewards", {
  id: serial("id").primaryKey(),
  brokerUserId: text("broker_user_id").notNull(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  brand: text("brand").notNull(),
  valueGbp: decimal("value_gbp", { precision: 8, scale: 2 }).notNull().default("5.00"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBrokerSentRewardSchema = createInsertSchema(brokerSentRewards).omit({ id: true, createdAt: true });
export type BrokerSentReward = typeof brokerSentRewards.$inferSelect;
export type InsertBrokerSentReward = z.infer<typeof insertBrokerSentRewardSchema>;
