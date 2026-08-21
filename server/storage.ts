import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Company,
  InsertCompany,
  Client,
  InsertClient,
  JourneyStep,
  InsertJourneyStep,
  Reward,
  InsertReward,
  Offer,
  InsertOffer,
  Notification,
  InsertNotification,
  Message,
  InsertMessage,
  Enquiry,
  InsertEnquiry,
  Referral,
  InsertReferral,
  PayoutRequest,
  InsertPayoutRequest,
  BrokerNotification,
  InsertBrokerNotification,
  PushSubscription,
  PaymentReminder,
  InsertPaymentReminder,
  UpdatePaymentReminder,
  CompanyAnnouncement,
  InsertCompanyAnnouncement,
  CompanyMessage,
  InsertCompanyMessage,
  RewardQueueItem,
  InsertRewardQueueItem,
  ClientAppointment,
  InsertClientAppointment,
  EngagementEvent,
  InsertEngagementEvent,
  MarketplaceClick,
  InsertMarketplaceClick,
  ClientReassignmentLog,
  InsertClientReassignmentLog,
  PrizeDraw,
  InsertPrizeDraw,
  PrizeDrawEntry,
  Charity,
  InsertCharity,
  CharityDonation,
  BrokerSentReward,
  InsertBrokerSentReward,
} from "@shared/schema";
import { eq, desc, asc, sql, count, and, gte, inArray } from "drizzle-orm";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

function computeNextPaymentDate(dayOfMonth: number, now: Date): Date {
  const lastDayOfMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();
  const y1 = now.getFullYear();
  const m1 = now.getMonth();
  const clamped1 = Math.min(dayOfMonth, lastDayOfMonth(y1, m1));
  const candidate = new Date(y1, m1, clamped1, 0, 0, 0, 0);
  if (candidate.getTime() > now.getTime()) return candidate;
  const y2 = m1 === 11 ? y1 + 1 : y1;
  const m2 = (m1 + 1) % 12;
  const clamped2 = Math.min(dayOfMonth, lastDayOfMonth(y2, m2));
  return new Date(y2, m2, clamped2, 0, 0, 0, 0);
}

export interface IStorage {
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  getBrokersByCompanyId(companyId: number): Promise<User[]>;
  getCompanyAggregateStats(companyId: number): Promise<{
    totalBrokers: number;
    totalClients: number;
    totalRevenue: number;
    monthlyRevenue: number;
    companySplit: number;
    activeClients: number;
    newClientsThisMonth: number;
    monthlyBreakdown: { month: string; revenue: number }[];
    avgConversionRate: number;
    retentionRate: number;
  }>;
  getCompanyRevenueTimeline(companyId: number): Promise<Array<{ date: string; revenue: number }>>;
  getCompanyActivity(companyId: number): Promise<Array<{ type: string; brokerName: string; detail: string; timestamp: string }>>;
  getCompanyBrokerLeaderboard(companyId: number): Promise<Array<{
    id: string;
    name: string;
    email: string;
    brokerCode: string | null;
    clientCount: number;
    revenue: number;
    conversionRate: number;
    activeClients: number;
    joinedAt: string | null;
  }>>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByBrokerCode(brokerCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: { name?: string; dateOfBirth?: string; calendarUrl?: string | null }): Promise<User | undefined>;
  setBrokerCompany(brokerUserId: string, companyId: number | null): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: string, data: { stripeCustomerId?: string | null; stripeSubscriptionId?: string | null; plan?: string | null; growthBand?: number | null; subscriptionStatus?: string | null }): Promise<User | undefined>;
  addRewardCredits(userId: string, credits: number): Promise<number>;
  grantSessionCreditsIdempotent(sessionId: string, userId: string, credits: number): Promise<{ granted: boolean; newBalance: number }>;
  getPriceIdForCreditPack(credits: number): Promise<string | null>;
  createBrokerSentRewardAndDeductCredit(brokerUserId: string, clientId: number, brand: string, valueGbp: string): Promise<{ reward: BrokerSentReward; creditsRemaining: number } | { error: 'insufficient_credits' }>;
  getPlanMetadataForPrice(priceId: string): Promise<{ plan: string; band: number | null } | null>;
  getPriceIdForPlan(plan: string, band: number | null): Promise<string | null>;
  bumpUserLastActive(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  countUsersByRole(role: string): Promise<number>;
  getTotalUsersCount(): Promise<number>;
  
  getAllClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client>;
  getClientsByBrokerUserId(brokerUserId: string): Promise<Client[]>;
  assignClientToBroker(clientId: number, brokerUserId: string | null): Promise<Client>;
  assignClientToBrokerWithLog(clientId: number, brokerUserId: string | null, logEntry: InsertClientReassignmentLog): Promise<Client>;
  bulkAssignClientsToBroker(clientIds: number[], brokerUserId: string): Promise<Client[]>;
  bulkAssignClientsToBrokerWithLog(clients: { id: number }[], brokerUserId: string, logEntries: InsertClientReassignmentLog[]): Promise<Client[]>;
  getUnreviewedClientsByBroker(brokerUserId: string): Promise<Client[]>;
  markClientReviewed(clientId: number, data: { mortgageValue?: string; mortgageTerm?: number; interestRate?: string; renewalDate?: string }): Promise<Client>;
  
  getClientJourneySteps(clientId: number): Promise<JourneyStep[]>;
  getJourneyStepsForClients(clientIds: number[]): Promise<JourneyStep[]>;
  createJourneyStep(step: InsertJourneyStep): Promise<JourneyStep>;
  updateJourneyStep(id: number, data: Partial<InsertJourneyStep>): Promise<JourneyStep>;
  getBrokerCommission(brokerUserId: string): Promise<{ monthlyEarnings: number; totalRevenue: number }>;
  
  getClientRewards(clientId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  claimReward(id: number): Promise<Reward>;
  
  getClientOffers(clientId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  
  getClientNotifications(clientId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification>;
  
  getBrokerMessages(brokerUserId: string): Promise<Message[]>;
  getClientMessages(clientId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageRead(id: number, brokerUserId: string): Promise<Message | null>;
  markClientMessageRead(id: number, clientId: number): Promise<Message | null>;
  
  getBrokerEnquiries(brokerUserId: string): Promise<Enquiry[]>;
  getClientEnquiries(clientId: number): Promise<Enquiry[]>;
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  markEnquiryRead(id: number, brokerUserId: string): Promise<Enquiry | null>;
  updateEnquiry(id: number, data: Partial<Enquiry>): Promise<Enquiry | null>;
  
  getClientByReferralCode(referralCode: string): Promise<Client | undefined>;
  generateReferralCode(clientId: number): Promise<string>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByReferrer(referrerClientId: number): Promise<Referral[]>;
  getReferralStats(clientId: number): Promise<{ count: number; totalRewards: string }>;

  createPayoutRequest(payout: InsertPayoutRequest): Promise<PayoutRequest>;
  getBrokerPayouts(brokerUserId: string): Promise<PayoutRequest[]>;
  getAllPayouts(): Promise<(PayoutRequest & { brokerName?: string; brokerEmail?: string })[]>;
  updatePayoutStatus(id: number, status: string): Promise<PayoutRequest>;
  getBrokerPaidTotal(brokerUserId: string): Promise<number>;

  getBrokerNotifications(brokerUserId: string): Promise<BrokerNotification[]>;
  createBrokerNotification(notification: InsertBrokerNotification): Promise<BrokerNotification>;
  markBrokerNotificationRead(id: number, brokerUserId: string): Promise<BrokerNotification | null>;

  logReassignment(entry: InsertClientReassignmentLog): Promise<ClientReassignmentLog>;
  getReassignmentHistory(companyId: number, limit?: number): Promise<ClientReassignmentLog[]>;

  createCompanyAnnouncement(announcement: InsertCompanyAnnouncement): Promise<CompanyAnnouncement>;
  getCompanyAnnouncements(companyId: number): Promise<CompanyAnnouncement[]>;
  createCompanyMessage(message: InsertCompanyMessage): Promise<CompanyMessage>;
  getCompanyMessages(companyId: number): Promise<CompanyMessage[]>;
  getBrokerCompanyMessages(brokerUserId: string, companyId: number): Promise<CompanyMessage[]>;
  markCompanyMessageRead(id: number): Promise<CompanyMessage | null>;

  savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription>;
  removePushSubscription(userId: string, endpoint: string): Promise<void>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getUpcomingAppointmentsForReminder(): Promise<Enquiry[]>;
  getUpcomingAppointmentsFor2MinReminder(): Promise<Enquiry[]>;
  markEnquiryReminderSent(id: number): Promise<void>;
  markEnquiryReminder2MinSent(id: number): Promise<void>;

  createClientAppointment(appointment: InsertClientAppointment): Promise<ClientAppointment>;
  getDueClientAppointmentReminders(): Promise<ClientAppointment[]>;
  markClientAppointmentReminderSent(id: number): Promise<void>;

  createEngagementEvent(event: InsertEngagementEvent): Promise<EngagementEvent>;
  createMarketplaceClick(click: InsertMarketplaceClick): Promise<MarketplaceClick>;
  listAffiliateDeals(opts?: { activeOnly?: boolean }): Promise<schema.AffiliateDealRow[]>;
  getAffiliateDeal(id: string): Promise<schema.AffiliateDealRow | undefined>;
  createAffiliateDeal(input: schema.InsertAffiliateDeal): Promise<schema.AffiliateDealRow>;
  updateAffiliateDeal(id: string, patch: schema.UpdateAffiliateDeal): Promise<schema.AffiliateDealRow | undefined>;
  deleteAffiliateDeal(id: string): Promise<boolean>;
  getDealClickCounts(sinceDays: number): Promise<Record<string, number>>;
  getAdminOverview(): Promise<{
    totalUsers: number;
    totalClients: number;
    totalBrokers: number;
    totalAdmins: number;
    totalCompanies: number;
    liveNow: number;
    liveNowPrev5m: number;
    activeThisWeek: number;
    activeLastWeek: number;
    newSignups7d: number;
    newSignups30d: number;
    signupsToday: number;
    signupsYesterday: number;
    clientSignupsToday: number;
    clientSignupsYesterday: number;
    brokerSignupsToday: number;
    brokerSignupsYesterday: number;
    companySignupsToday: number;
    companySignupsYesterday: number;
    signupsByDay: Array<{ date: string; clients: number; brokers: number }>;
    marketplace: {
      clicks24h: number;
      clicksPrev24h: number;
      clicks7d: number;
      clicks30d: number;
      topDeals: Array<{ dealId: string; clicks: number }>;
      byTab: { home: number; finance: number; leisure: number };
    };
    subscriptions: {
      byPlan: Array<{ plan: string; band: number | null; count: number }>;
      byStatus: Array<{ status: string; count: number }>;
      activeStarter: number;
      activeGrowthBand1: number;
      activeGrowthBand2: number;
      activeGrowthBand3: number;
      trialing: number;
      cancelled: number;
      mrrEstimate: number;
    };
  }>;
  getAllClientsAdmin(): Promise<Array<{
    userId: string;
    clientId: number | null;
    name: string;
    email: string;
    status: string | null;
    brokerUserId: string | null;
    brokerName: string | null;
    createdAt: string | null;
    lastActiveAt: string | null;
    completedSteps: number;
    totalSteps: number;
  }>>;
  getAllBrokersAdmin(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    brokerCode: string | null;
    plan: string | null;
    growthBand: number | null;
    subscriptionStatus: string | null;
    companyName: string | null;
    clientCount: number;
    createdAt: string | null;
    lastActiveAt: string | null;
  }>>;
  getAllCompaniesAdmin(): Promise<Array<{
    id: number;
    name: string;
    companyCode: string;
    contactEmail: string;
    brokerCount: number;
    clientCount: number;
    createdAt: string | null;
  }>>;
  getBrokerEngagementSummary(brokerUserId: string): Promise<{
    activeHomeowners: number;
    gainedThisMonth: number;
    activeThisMonthCount: number;
    activeThisMonthPct: number;
    clientActionsThisWeek: number;
    referralsCount: number;
    introductionsCount: number;
  }>;

  getPaymentReminderByClient(clientId: number): Promise<PaymentReminder | undefined>;
  upsertPaymentReminder(clientId: number, data: { dayOfMonth?: number; customMessage?: string | null; enabled?: boolean }): Promise<PaymentReminder>;
  deletePaymentReminder(clientId: number): Promise<PaymentReminder | undefined>;
  getDuePaymentReminders(): Promise<PaymentReminder[]>;
  markPaymentReminderSent(id: number, sentForDate: string): Promise<void>;

  createRewardQueueItem(item: InsertRewardQueueItem): Promise<RewardQueueItem>;
  getRewardQueueByStatus(status: string): Promise<RewardQueueItem[]>;
  getAllRewardQueue(): Promise<RewardQueueItem[]>;
  getRewardQueueItem(id: number): Promise<RewardQueueItem | undefined>;
  updateRewardQueueItem(id: number, updates: Partial<RewardQueueItem>): Promise<RewardQueueItem | null>;
  getRewardQueueByClientAndStep(clientId: number, stepId: number): Promise<RewardQueueItem | undefined>;

  getChecklistItems(month: string): Promise<schema.ChecklistItem[]>;
  getChecklistCompletions(clientId: number, month: string): Promise<schema.ChecklistCompletion[]>;
  completeChecklistItem(clientId: number, itemId: number): Promise<schema.ChecklistCompletion>;
  getClientTotalPoints(clientId: number): Promise<number>;

  // Gift cards
  uploadGiftCards(brandKey: string, brandLabel: string, faceValue: number, pointsCost: number, codes: Array<{ code: string; pin?: string }>): Promise<number>;
  getGiftCardStock(): Promise<Array<{ brandKey: string; brandLabel: string; faceValue: string; pointsCost: number; available: number; redeemed: number; enabled: boolean }>>;
  getGiftCardBrandCodes(brandKey: string): Promise<Array<{ id: number; code: string; pin: string | null; uploadedAt: Date; isAvailable: boolean }>>;
  updateGiftCardBrand(brandKey: string, brandLabel: string, faceValue: number, pointsCost: number, newCodes: Array<{ code: string; pin?: string }>): Promise<{ updatedCards: number; addedCodes: number }>;
  toggleGiftCardBrand(brandKey: string, enabled: boolean): Promise<void>;
  claimGiftCard(brandKey: string, clientId: number, pointsCost: number): Promise<schema.GiftCard>;
  getClientRedeemedCards(clientId: number): Promise<Array<schema.GiftCard & { pointsSpent: number }>>;

  // Prize draws
  createPrizeDraw(data: InsertPrizeDraw): Promise<PrizeDraw>;
  listPrizeDraws(): Promise<Array<PrizeDraw & { totalEntries: number; uniqueParticipants: number }>>;
  getPrizeDraw(id: number): Promise<PrizeDraw | undefined>;
  updatePrizeDraw(id: number, patch: Partial<Pick<PrizeDraw, 'status' | 'winnerEntryId' | 'winnerNotified' | 'title' | 'description' | 'prize' | 'pointsPerEntry' | 'maxEntriesPerClient' | 'drawDate'>>): Promise<PrizeDraw | undefined>;
  getActivePrizeDraw(): Promise<PrizeDraw | undefined>;
  enterPrizeDraw(drawId: number, clientId: number, numEntries: number): Promise<PrizeDrawEntry>;
  getDrawEntries(drawId: number): Promise<Array<PrizeDrawEntry & { clientName: string; clientEmail: string }>>;
  getClientDrawEntries(drawId: number, clientId: number): Promise<number>;
  pickDrawWinner(drawId: number): Promise<{ entry: PrizeDrawEntry; clientName: string; clientEmail: string } | null>;

  // Charities
  createCharity(data: InsertCharity): Promise<Charity>;
  listCharities(activeOnly?: boolean): Promise<Charity[]>;
  updateCharity(id: number, patch: Partial<InsertCharity>): Promise<Charity | undefined>;
  donateToCharity(charityId: number, clientId: number, pointsDonated: number): Promise<CharityDonation>;
  listAllDonations(): Promise<Array<CharityDonation & { charityName: string; clientName: string; clientEmail: string }>>;
  getCharityDonationTotals(): Promise<Array<{ charityId: number; charityName: string; totalPoints: number; totalPounds: string; pendingCount: number; fulfilledCount: number }>>;
  markDonationsFulfilled(charityId: number): Promise<number>;
  getClientDonations(clientId: number): Promise<Array<CharityDonation & { charityName: string }>>;

  // Broker sent rewards
  createBrokerSentReward(data: InsertBrokerSentReward): Promise<BrokerSentReward>;
  getBrokerSentRewards(brokerUserId: string): Promise<Array<BrokerSentReward & { clientName: string; clientEmail: string }>>;
  getClientBrokerRewards(clientId: number): Promise<BrokerSentReward[]>;
  getAllBrokerSentRewards(): Promise<Array<BrokerSentReward & { clientName: string; clientEmail: string; brokerName: string; brokerCredits: number }>>;
  updateBrokerSentRewardStatus(id: number, status: string): Promise<BrokerSentReward | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(schema.companies).values(company).returning();
    return result[0];
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const result = await db.select().from(schema.companies).where(eq(schema.companies.id, id));
    return result[0];
  }

  async updateCompanyLogo(companyId: number, logoUrl: string): Promise<Company | undefined> {
    const result = await db.update(schema.companies).set({ logoUrl }).where(eq(schema.companies.id, companyId)).returning();
    return result[0];
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const result = await db.select().from(schema.companies).where(eq(schema.companies.companyCode, code));
    return result[0];
  }

  async getAllCompanies(): Promise<Company[]> {
    return db.select().from(schema.companies).orderBy(desc(schema.companies.createdAt));
  }

  async getBrokersByCompanyId(companyId: number): Promise<User[]> {
    return db.select().from(schema.users).where(
      and(eq(schema.users.companyId, companyId), eq(schema.users.role, "broker"))
    ).orderBy(desc(schema.users.createdAt));
  }

  async getCompanyAggregateStats(companyId: number): Promise<{
    totalBrokers: number;
    totalClients: number;
    totalRevenue: number;
    monthlyRevenue: number;
    companySplit: number;
    activeClients: number;
    newClientsThisMonth: number;
    monthlyBreakdown: { month: string; revenue: number }[];
    avgConversionRate: number;
    retentionRate: number;
  }> {
    const COMMISSION_RATE = 0.0035;
    const COMPANY_SPLIT_RATE = 0.30;
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const brokers = await this.getBrokersByCompanyId(companyId);
    const totalBrokers = brokers.length;
    let totalClients = 0;
    let activeClients = 0;
    let newClientsThisMonth = 0;
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let totalConversionRate = 0;
    const revenueByMonth: Record<string, number> = {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const broker of brokers) {
      const clients = await this.getClientsByBrokerUserId(broker.id);
      totalClients += clients.length;
      activeClients += clients.filter(c => c.status === "Active").length;
      newClientsThisMonth += clients.filter(c => {
        if (!c.createdAt) return false;
        return new Date(c.createdAt) >= startOfMonth;
      }).length;

      for (const client of clients) {
        const mortgage = parseFloat(client.mortgageValue) || 0;
        const commission = Math.round(mortgage * COMMISSION_RATE * 100) / 100;
        if (client.createdAt) {
          const d = new Date(client.createdAt);
          const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          revenueByMonth[key] = (revenueByMonth[key] || 0) + commission;
          if (d >= startOfMonth) {
            monthlyRevenue += commission;
          }
        }
        totalRevenue += commission;
      }

      const commissionData = await this.getBrokerCommission(broker.id);
      totalConversionRate += commissionData.conversionRate;
    }

    const monthlyBreakdown = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => {
        const parseMonth = (s: string) => {
          const [m, y] = s.split(" ");
          return new Date(parseInt(y), MONTH_NAMES.indexOf(m), 1).getTime();
        };
        return parseMonth(a.month) - parseMonth(b.month);
      });

    const avgConversionRate = totalBrokers > 0 ? Math.round(totalConversionRate / totalBrokers) : 0;
    const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
    const companySplit = Math.round(totalRevenue * COMPANY_SPLIT_RATE * 100) / 100;

    return {
      totalBrokers,
      totalClients,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      companySplit,
      activeClients,
      newClientsThisMonth,
      monthlyBreakdown,
      avgConversionRate,
      retentionRate,
    };
  }

  async getCompanyRevenueTimeline(companyId: number): Promise<Array<{ date: string; revenue: number }>> {
    const COMMISSION_RATE = 0.0035;
    const brokers = await this.getBrokersByCompanyId(companyId);
    const revenueByDate: Record<string, number> = {};

    for (const broker of brokers) {
      const clients = await this.getClientsByBrokerUserId(broker.id);
      for (const client of clients) {
        const mortgage = parseFloat(client.mortgageValue) || 0;
        const commission = Math.round(mortgage * COMMISSION_RATE * 100) / 100;
        if (client.createdAt) {
          const d = new Date(client.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          revenueByDate[key] = (revenueByDate[key] || 0) + commission;
        }
      }
    }

    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCompanyActivity(companyId: number): Promise<Array<{ type: string; brokerName: string; detail: string; timestamp: string }>> {
    const brokers = await this.getBrokersByCompanyId(companyId);
    const activity: Array<{ type: string; brokerName: string; detail: string; timestamp: string }> = [];

    for (const broker of brokers) {
      const clients = await this.getClientsByBrokerUserId(broker.id);
      for (const client of clients.slice(0, 5)) {
        if (client.createdAt) {
          activity.push({
            type: "new_client",
            brokerName: broker.name,
            detail: `${client.name} joined portfolio`,
            timestamp: client.createdAt.toString(),
          });
        }
      }

      const enquiries = await this.getBrokerEnquiries(broker.id);
      for (const enquiry of enquiries.slice(0, 5)) {
        activity.push({
          type: "enquiry",
          brokerName: broker.name,
          detail: `${enquiry.productType} enquiry`,
          timestamp: enquiry.createdAt.toString(),
        });
      }

      const messages = await this.getBrokerMessages(broker.id);
      for (const msg of messages.slice(0, 3)) {
        activity.push({
          type: "message",
          brokerName: broker.name,
          detail: msg.subject || "Client message",
          timestamp: msg.createdAt.toString(),
        });
      }
    }

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activity.slice(0, 15);
  }

  async getCompanyBrokerLeaderboard(companyId: number): Promise<Array<{
    id: string;
    name: string;
    email: string;
    brokerCode: string | null;
    clientCount: number;
    revenue: number;
    conversionRate: number;
    activeClients: number;
    joinedAt: string | null;
  }>> {
    const brokers = await this.getBrokersByCompanyId(companyId);
    const leaderboard = [];

    for (const broker of brokers) {
      const clients = await this.getClientsByBrokerUserId(broker.id);
      const commission = await this.getBrokerCommission(broker.id);
      const activeClients = clients.filter(c => c.status === "Active").length;

      leaderboard.push({
        id: broker.id,
        name: broker.name,
        email: broker.email,
        brokerCode: broker.brokerCode,
        clientCount: clients.length,
        revenue: commission.totalRevenue,
        conversionRate: (commission as any).conversionRate || 0,
        activeClients,
        joinedAt: broker.createdAt?.toString() || null,
      });
    }

    leaderboard.sort((a, b) => b.clientCount - a.clientCount || b.revenue - a.revenue);
    return leaderboard;
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(sql`LOWER(${schema.users.email}) = LOWER(${email})`);
    return result[0];
  }

  async getUserByBrokerCode(brokerCode: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.brokerCode, brokerCode));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, data: { name?: string; dateOfBirth?: string; calendarUrl?: string | null }): Promise<User | undefined> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.calendarUrl !== undefined) updateData.calendarUrl = data.calendarUrl;
    if (Object.keys(updateData).length === 0) return this.getUser(id);
    const result = await db.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async setBrokerCompany(brokerUserId: string, companyId: number | null): Promise<User | undefined> {
    const result = await db.update(schema.users).set({ companyId }).where(eq(schema.users.id, brokerUserId)).returning();
    return result[0];
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.stripeCustomerId, stripeCustomerId));
    return result[0];
  }

  async updateUserStripeInfo(id: string, data: { stripeCustomerId?: string | null; stripeSubscriptionId?: string | null; plan?: string | null; growthBand?: number | null; subscriptionStatus?: string | null }): Promise<User | undefined> {
    const updateData: Record<string, any> = {};
    if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;
    if (data.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.growthBand !== undefined) updateData.growthBand = data.growthBand;
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
    if (Object.keys(updateData).length === 0) return this.getUser(id);
    const result = await db.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getPlanMetadataForPrice(priceId: string): Promise<{ plan: string; band: number | null } | null> {
    const result: any = await db.execute(sql`
      SELECT
        COALESCE(pr.metadata->>'plan', p.metadata->>'plan') AS plan,
        COALESCE(pr.metadata->>'band', p.metadata->>'band') AS band
      FROM stripe.prices pr
      LEFT JOIN stripe.products p ON p.id = pr.product
      WHERE pr.id = ${priceId}
      LIMIT 1
    `);
    const row = result.rows?.[0];
    if (!row?.plan) return null;
    const band = row.band ? parseInt(row.band, 10) : null;
    return { plan: row.plan, band: Number.isFinite(band as number) ? band : null };
  }

  async getPriceIdForPlan(plan: string, band: number | null): Promise<string | null> {
    const bandStr = band == null ? null : String(band);
    const result: any = await db.execute(sql`
      SELECT pr.id AS id
      FROM stripe.prices pr
      LEFT JOIN stripe.products p ON p.id = pr.product
      WHERE pr.active = true
        AND COALESCE(pr.metadata->>'plan', p.metadata->>'plan') = ${plan}
        AND (
          ${bandStr}::text IS NULL
          OR COALESCE(pr.metadata->>'band', p.metadata->>'band') = ${bandStr}
        )
      ORDER BY pr.created DESC
      LIMIT 1
    `);
    return result.rows?.[0]?.id ?? null;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(schema.users).where(eq(schema.users.role, role)).orderBy(desc(schema.users.createdAt));
  }

  async countUsersByRole(role: string): Promise<number> {
    const result = await db.select({ count: count() }).from(schema.users).where(eq(schema.users.role, role));
    return Number(result[0]?.count || 0);
  }

  async getTotalUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(schema.users);
    return Number(result[0]?.count || 0);
  }

  async getAllClients(): Promise<Client[]> {
    return db.select().from(schema.clients).orderBy(desc(schema.clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
    return result[0];
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const result = await db.select().from(schema.clients).where(sql`LOWER(${schema.clients.email}) = LOWER(${email})`);
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(schema.clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
    const result = await db.update(schema.clients).set(data).where(eq(schema.clients.id, id)).returning();
    return result[0];
  }

  async getClientsByBrokerUserId(brokerUserId: string): Promise<Client[]> {
    return db.select().from(schema.clients).where(eq(schema.clients.brokerUserId, brokerUserId)).orderBy(desc(schema.clients.createdAt));
  }

  async assignClientToBroker(clientId: number, brokerUserId: string | null): Promise<Client> {
    const result = await db.update(schema.clients).set({ brokerUserId }).where(eq(schema.clients.id, clientId)).returning();
    return result[0];
  }

  async assignClientToBrokerWithLog(clientId: number, brokerUserId: string | null, logEntry: InsertClientReassignmentLog): Promise<Client> {
    return db.transaction(async (tx) => {
      const result = await tx.update(schema.clients).set({ brokerUserId }).where(eq(schema.clients.id, clientId)).returning();
      await tx.insert(schema.clientReassignmentLog).values(logEntry);
      return result[0];
    });
  }

  async bulkAssignClientsToBroker(clientIds: number[], brokerUserId: string): Promise<Client[]> {
    return db.transaction(async (tx) => {
      const updated: Client[] = [];
      for (const clientId of clientIds) {
        const result = await tx
          .update(schema.clients)
          .set({ brokerUserId })
          .where(eq(schema.clients.id, clientId))
          .returning();
        updated.push(result[0]);
      }
      return updated;
    });
  }

  async bulkAssignClientsToBrokerWithLog(clients: { id: number }[], brokerUserId: string, logEntries: InsertClientReassignmentLog[]): Promise<Client[]> {
    return db.transaction(async (tx) => {
      const updated: Client[] = [];
      for (const client of clients) {
        const result = await tx
          .update(schema.clients)
          .set({ brokerUserId })
          .where(eq(schema.clients.id, client.id))
          .returning();
        updated.push(result[0]);
      }
      if (logEntries.length > 0) {
        await tx.insert(schema.clientReassignmentLog).values(logEntries);
      }
      return updated;
    });
  }

  async getUnreviewedClientsByBroker(brokerUserId: string): Promise<Client[]> {
    return db.select().from(schema.clients).where(
      and(
        eq(schema.clients.brokerUserId, brokerUserId),
        eq(schema.clients.reviewedByBroker, false)
      )
    ).orderBy(desc(schema.clients.createdAt));
  }

  async markClientReviewed(clientId: number, data: { mortgageValue?: string; mortgageTerm?: number; interestRate?: string; renewalDate?: string }): Promise<Client> {
    const updateData: Record<string, any> = { reviewedByBroker: true };
    if (data.mortgageValue !== undefined) updateData.mortgageValue = data.mortgageValue;
    if (data.mortgageTerm !== undefined) updateData.mortgageTerm = data.mortgageTerm;
    if (data.interestRate !== undefined) updateData.interestRate = data.interestRate;
    if (data.renewalDate !== undefined) updateData.renewalDate = data.renewalDate;
    const result = await db.update(schema.clients).set(updateData).where(eq(schema.clients.id, clientId)).returning();
    return result[0];
  }

  async getClientJourneySteps(clientId: number): Promise<JourneyStep[]> {
    return db.select().from(schema.journeySteps).where(eq(schema.journeySteps.clientId, clientId)).orderBy(asc(schema.journeySteps.stepId));
  }

  async getJourneyStepsForClients(clientIds: number[]): Promise<JourneyStep[]> {
    if (clientIds.length === 0) return [];
    return db.select().from(schema.journeySteps).where(inArray(schema.journeySteps.clientId, clientIds)).orderBy(asc(schema.journeySteps.stepId));
  }

  async createJourneyStep(step: InsertJourneyStep): Promise<JourneyStep> {
    const result = await db.insert(schema.journeySteps).values(step).returning();
    return result[0];
  }

  async updateJourneyStep(id: number, data: Partial<InsertJourneyStep>): Promise<JourneyStep> {
    const result = await db.update(schema.journeySteps).set(data).where(eq(schema.journeySteps.id, id)).returning();
    return result[0];
  }

  async getBrokerCommission(brokerUserId: string): Promise<{ monthlyEarnings: number; totalRevenue: number; conversionRate: number }> {
    const COMMISSION_RATE = 0.0035;

    const clients = await db.select({
      id: schema.clients.id,
      mortgageValue: schema.clients.mortgageValue,
      status: schema.clients.status,
      createdAt: schema.clients.createdAt,
    }).from(schema.clients).where(eq(schema.clients.brokerUserId, brokerUserId));
    if (clients.length === 0) return { monthlyEarnings: 0, totalRevenue: 0, conversionRate: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let monthlyEarnings = 0;
    let totalRevenue = 0;
    let activeCount = 0;

    for (const client of clients) {
      const mortgage = parseFloat(client.mortgageValue) || 0;
      const commission = Math.round(mortgage * COMMISSION_RATE * 100) / 100;
      totalRevenue += commission;
      if (client.createdAt && new Date(client.createdAt) >= startOfMonth) {
        monthlyEarnings += commission;
      }
      if (client.status === "Active") {
        activeCount++;
      }
    }

    const conversionRate = clients.length > 0 ? Math.round((activeCount / clients.length) * 100) : 0;

    return { monthlyEarnings: Math.round(monthlyEarnings * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100, conversionRate };
  }

  async getClientRewards(clientId: number): Promise<Reward[]> {
    return db.select().from(schema.rewards).where(eq(schema.rewards.clientId, clientId));
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const result = await db.insert(schema.rewards).values(reward).returning();
    return result[0];
  }

  async claimReward(id: number): Promise<Reward> {
    const result = await db
      .update(schema.rewards)
      .set({ claimed: true, claimedAt: new Date() })
      .where(eq(schema.rewards.id, id))
      .returning();
    return result[0];
  }

  async getClientOffers(clientId: number): Promise<Offer[]> {
    return db.select().from(schema.offers).where(eq(schema.offers.clientId, clientId)).orderBy(desc(schema.offers.createdAt));
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const result = await db.insert(schema.offers).values(offer).returning();
    return result[0];
  }

  async getClientNotifications(clientId: number): Promise<Notification[]> {
    return db.select().from(schema.notifications).where(eq(schema.notifications.clientId, clientId)).orderBy(desc(schema.notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(schema.notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const result = await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result[0];
  }

  async getBrokerMessages(brokerUserId: string): Promise<Message[]> {
    return db.select().from(schema.messages).where(eq(schema.messages.brokerUserId, brokerUserId)).orderBy(desc(schema.messages.createdAt));
  }

  async getClientMessages(clientId: number): Promise<Message[]> {
    return db.select().from(schema.messages).where(eq(schema.messages.clientId, clientId)).orderBy(asc(schema.messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(schema.messages).values(message).returning();
    return result[0];
  }

  async markMessageRead(id: number, brokerUserId: string): Promise<Message | null> {
    const result = await db
      .update(schema.messages)
      .set({ read: true })
      .where(and(eq(schema.messages.id, id), eq(schema.messages.brokerUserId, brokerUserId)))
      .returning();
    return result[0] || null;
  }

  async markClientMessageRead(id: number, clientId: number): Promise<Message | null> {
    const result = await db
      .update(schema.messages)
      .set({ read: true })
      .where(and(
        eq(schema.messages.id, id), 
        eq(schema.messages.clientId, clientId),
        eq(schema.messages.senderType, "broker")
      ))
      .returning();
    return result[0] || null;
  }

  async getBrokerEnquiries(brokerUserId: string): Promise<Enquiry[]> {
    const result = await db
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.brokerUserId, brokerUserId))
      .orderBy(desc(schema.enquiries.createdAt));
    return result;
  }

  async createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry> {
    const result = await db.insert(schema.enquiries).values(enquiry).returning();
    return result[0];
  }

  async markEnquiryRead(id: number, brokerUserId: string): Promise<Enquiry | null> {
    const result = await db
      .update(schema.enquiries)
      .set({ read: true })
      .where(and(eq(schema.enquiries.id, id), eq(schema.enquiries.brokerUserId, brokerUserId)))
      .returning();
    return result[0] || null;
  }

  async getClientEnquiries(clientId: number): Promise<Enquiry[]> {
    const result = await db
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.clientId, clientId))
      .orderBy(desc(schema.enquiries.createdAt));
    return result;
  }

  async updateEnquiry(id: number, data: Partial<Enquiry>): Promise<Enquiry | null> {
    const result = await db
      .update(schema.enquiries)
      .set(data)
      .where(eq(schema.enquiries.id, id))
      .returning();
    return result[0] || null;
  }

  async getClientByReferralCode(referralCode: string): Promise<Client | undefined> {
    const result = await db.select().from(schema.clients).where(eq(schema.clients.referralCode, referralCode));
    return result[0];
  }

  async generateReferralCode(clientId: number): Promise<string> {
    const client = await this.getClient(clientId);
    if (!client) throw new Error("Client not found");
    
    if (client.referralCode) {
      return client.referralCode;
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    
    do {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await this.getClientByReferralCode(code);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
    
    await db.update(schema.clients).set({ referralCode: code }).where(eq(schema.clients.id, clientId));
    return code;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const result = await db.insert(schema.referrals).values(referral).returning();
    return result[0];
  }

  async getReferralsByReferrer(referrerClientId: number): Promise<Referral[]> {
    return db.select().from(schema.referrals).where(eq(schema.referrals.referrerClientId, referrerClientId)).orderBy(desc(schema.referrals.createdAt));
  }

  async getReferralStats(clientId: number): Promise<{ count: number; totalRewards: string }> {
    const referrals = await this.getReferralsByReferrer(clientId);
    const totalRewards = referrals.reduce((sum, r) => sum + parseFloat(r.rewardAmount || '0'), 0);
    return {
      count: referrals.length,
      totalRewards: totalRewards.toFixed(2)
    };
  }

  async createPayoutRequest(payout: InsertPayoutRequest): Promise<PayoutRequest> {
    const result = await db.insert(schema.payoutRequests).values(payout).returning();
    return result[0];
  }

  async getBrokerPayouts(brokerUserId: string): Promise<PayoutRequest[]> {
    return db.select().from(schema.payoutRequests).where(eq(schema.payoutRequests.brokerUserId, brokerUserId)).orderBy(desc(schema.payoutRequests.requestedAt));
  }

  async getAllPayouts(): Promise<(PayoutRequest & { brokerName?: string; brokerEmail?: string })[]> {
    const payouts = await db.select().from(schema.payoutRequests).orderBy(desc(schema.payoutRequests.requestedAt));
    const enriched = [];
    for (const payout of payouts) {
      const user = await this.getUser(payout.brokerUserId);
      enriched.push({
        ...payout,
        brokerName: user?.name,
        brokerEmail: user?.email,
      });
    }
    return enriched;
  }

  async updatePayoutStatus(id: number, status: string): Promise<PayoutRequest> {
    const processedAt = (status === "approved" || status === "paid" || status === "rejected") ? new Date() : null;
    const result = await db.update(schema.payoutRequests).set({ status, processedAt }).where(eq(schema.payoutRequests.id, id)).returning();
    return result[0];
  }

  async getBrokerPaidTotal(brokerUserId: string): Promise<number> {
    const payouts = await db.select({ amount: schema.payoutRequests.amount, status: schema.payoutRequests.status }).from(schema.payoutRequests).where(eq(schema.payoutRequests.brokerUserId, brokerUserId));
    return payouts.filter(p => p.status === "paid" || p.status === "approved").reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }

  async getBrokerNotifications(brokerUserId: string): Promise<BrokerNotification[]> {
    return db.select().from(schema.brokerNotifications).where(eq(schema.brokerNotifications.brokerUserId, brokerUserId)).orderBy(desc(schema.brokerNotifications.createdAt));
  }

  async createBrokerNotification(notification: InsertBrokerNotification): Promise<BrokerNotification> {
    const result = await db.insert(schema.brokerNotifications).values(notification).returning();
    return result[0];
  }

  async markBrokerNotificationRead(id: number, brokerUserId: string): Promise<BrokerNotification | null> {
    const result = await db.update(schema.brokerNotifications)
      .set({ read: true })
      .where(and(eq(schema.brokerNotifications.id, id), eq(schema.brokerNotifications.brokerUserId, brokerUserId)))
      .returning();
    return result[0] || null;
  }

  async savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> {
    await db.delete(schema.pushSubscriptions).where(
      and(eq(schema.pushSubscriptions.userId, userId), eq(schema.pushSubscriptions.endpoint, endpoint))
    );
    const result = await db.insert(schema.pushSubscriptions).values({ userId, endpoint, p256dh, auth }).returning();
    return result[0];
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db.delete(schema.pushSubscriptions).where(
      and(eq(schema.pushSubscriptions.userId, userId), eq(schema.pushSubscriptions.endpoint, endpoint))
    );
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  }

  async getUpcomingAppointmentsForReminder(): Promise<Enquiry[]> {
    return db.select().from(schema.enquiries).where(
      and(
        eq(schema.enquiries.reminderSent, false),
        sql`${schema.enquiries.meetingDate} IS NOT NULL`,
        sql`${schema.enquiries.meetingStatus} IN ('scheduled', 'confirmed')`
      )
    );
  }

  async markEnquiryReminderSent(id: number): Promise<void> {
    await db.update(schema.enquiries).set({ reminderSent: true }).where(eq(schema.enquiries.id, id));
  }

  async getUpcomingAppointmentsFor2MinReminder(): Promise<Enquiry[]> {
    return db.select().from(schema.enquiries).where(
      and(
        eq(schema.enquiries.reminder2MinSent, false),
        sql`${schema.enquiries.meetingDate} IS NOT NULL`,
        sql`${schema.enquiries.meetingStatus} IN ('scheduled', 'confirmed')`
      )
    );
  }

  async markEnquiryReminder2MinSent(id: number): Promise<void> {
    await db.update(schema.enquiries).set({ reminder2MinSent: true }).where(eq(schema.enquiries.id, id));
  }

  async createClientAppointment(appointment: InsertClientAppointment): Promise<ClientAppointment> {
    const result = await db.insert(schema.clientAppointments).values(appointment).returning();
    return result[0];
  }

  async getDueClientAppointmentReminders(): Promise<ClientAppointment[]> {
    return db.select().from(schema.clientAppointments).where(
      and(
        eq(schema.clientAppointments.reminderSent, false),
        sql`${schema.clientAppointments.remindAt} IS NOT NULL`,
        sql`${schema.clientAppointments.remindAt} <= NOW()`
      )
    );
  }

  async markClientAppointmentReminderSent(id: number): Promise<void> {
    await db.update(schema.clientAppointments).set({ reminderSent: true }).where(eq(schema.clientAppointments.id, id));
  }

  async logReassignment(entry: InsertClientReassignmentLog): Promise<ClientReassignmentLog> {
    const result = await db.insert(schema.clientReassignmentLog).values(entry).returning();
    return result[0];
  }

  async getReassignmentHistory(companyId: number, limit = 100): Promise<ClientReassignmentLog[]> {
    return db.select().from(schema.clientReassignmentLog)
      .where(eq(schema.clientReassignmentLog.companyId, companyId))
      .orderBy(desc(schema.clientReassignmentLog.reassignedAt))
      .limit(limit);
  }

  async createCompanyAnnouncement(announcement: InsertCompanyAnnouncement): Promise<CompanyAnnouncement> {
    const result = await db.insert(schema.companyAnnouncements).values(announcement).returning();
    return result[0];
  }

  async getCompanyAnnouncements(companyId: number): Promise<CompanyAnnouncement[]> {
    return db.select().from(schema.companyAnnouncements).where(eq(schema.companyAnnouncements.companyId, companyId)).orderBy(desc(schema.companyAnnouncements.createdAt));
  }

  async createCompanyMessage(message: InsertCompanyMessage): Promise<CompanyMessage> {
    const result = await db.insert(schema.companyMessages).values(message).returning();
    return result[0];
  }

  async getCompanyMessages(companyId: number): Promise<CompanyMessage[]> {
    return db.select().from(schema.companyMessages).where(eq(schema.companyMessages.companyId, companyId)).orderBy(desc(schema.companyMessages.createdAt));
  }

  async getBrokerCompanyMessages(brokerUserId: string, companyId: number): Promise<CompanyMessage[]> {
    return db.select().from(schema.companyMessages).where(
      and(
        eq(schema.companyMessages.brokerUserId, brokerUserId),
        eq(schema.companyMessages.companyId, companyId)
      )
    ).orderBy(asc(schema.companyMessages.createdAt));
  }

  async markCompanyMessageRead(id: number): Promise<CompanyMessage | null> {
    const result = await db.update(schema.companyMessages).set({ read: true }).where(eq(schema.companyMessages.id, id)).returning();
    return result[0] || null;
  }

  async createRewardQueueItem(item: InsertRewardQueueItem): Promise<RewardQueueItem> {
    const result = await db.insert(schema.rewardQueue).values(item).returning();
    return result[0];
  }

  async getRewardQueueByStatus(status: string): Promise<RewardQueueItem[]> {
    return db.select().from(schema.rewardQueue).where(eq(schema.rewardQueue.status, status)).orderBy(desc(schema.rewardQueue.createdAt));
  }

  async getAllRewardQueue(): Promise<RewardQueueItem[]> {
    return db.select().from(schema.rewardQueue).orderBy(desc(schema.rewardQueue.createdAt));
  }

  async getRewardQueueItem(id: number): Promise<RewardQueueItem | undefined> {
    const result = await db.select().from(schema.rewardQueue).where(eq(schema.rewardQueue.id, id));
    return result[0];
  }

  async updateRewardQueueItem(id: number, updates: Partial<RewardQueueItem>): Promise<RewardQueueItem | null> {
    const result = await db.update(schema.rewardQueue).set(updates).where(eq(schema.rewardQueue.id, id)).returning();
    return result[0] || null;
  }

  async getPaymentReminderByClient(clientId: number): Promise<PaymentReminder | undefined> {
    const result = await db.select().from(schema.paymentReminders).where(eq(schema.paymentReminders.clientId, clientId));
    return result[0];
  }

  async upsertPaymentReminder(clientId: number, data: { dayOfMonth?: number; customMessage?: string | null; enabled?: boolean }): Promise<PaymentReminder> {
    const existing = await this.getPaymentReminderByClient(clientId);
    if (existing) {
      type ReminderUpdate = Partial<Pick<PaymentReminder, "dayOfMonth" | "customMessage" | "enabled" | "lastSentForDate" | "updatedAt">>;
      const updateData: ReminderUpdate = { updatedAt: new Date() };
      if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
      if (data.customMessage !== undefined) updateData.customMessage = data.customMessage;
      if (data.enabled !== undefined) updateData.enabled = data.enabled;
      // Reset dedupe key when day or enabled changes so a new "today" can fire
      if (data.dayOfMonth !== undefined && data.dayOfMonth !== existing.dayOfMonth) {
        updateData.lastSentForDate = null;
      }
      if (data.enabled === true && existing.enabled === false) {
        updateData.lastSentForDate = null;
      }
      const result = await db.update(schema.paymentReminders).set(updateData).where(eq(schema.paymentReminders.clientId, clientId)).returning();
      return result[0];
    }
    const result = await db.insert(schema.paymentReminders).values({
      clientId,
      dayOfMonth: data.dayOfMonth ?? 1,
      customMessage: data.customMessage ?? null,
      enabled: data.enabled ?? true,
    }).returning();
    return result[0];
  }

  async deletePaymentReminder(clientId: number): Promise<PaymentReminder | undefined> {
    // Soft-disable: keep the row (and its lastSentForDate dedupe key) but turn it off.
    const result = await db.update(schema.paymentReminders)
      .set({ enabled: false, updatedAt: new Date() })
      .where(eq(schema.paymentReminders.clientId, clientId))
      .returning();
    return result[0];
  }

  async getDuePaymentReminders(): Promise<PaymentReminder[]> {
    // Returns reminders whose next payment date is within the 23h..25h window
    // (i.e. ~24h ±60min) AND haven't already been sent for that next date.
    // Dedupe (lastSentForDate !== nextDate key) is enforced here so the
    // method honours its contract independently of the caller.
    const all = await db.select().from(schema.paymentReminders).where(eq(schema.paymentReminders.enabled, true));
    const now = new Date();
    const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return all.filter(r => {
      const next = computeNextPaymentDate(r.dayOfMonth, now);
      const diffHours = (next.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 23 || diffHours > 25) return false;
      return r.lastSentForDate !== ymd(next);
    });
  }

  async markPaymentReminderSent(id: number, sentForDate: string): Promise<void> {
    await db.update(schema.paymentReminders).set({ lastSentForDate: sentForDate, updatedAt: new Date() }).where(eq(schema.paymentReminders.id, id));
  }

  async getRewardQueueByClientAndStep(clientId: number, stepId: number): Promise<RewardQueueItem | undefined> {
    const result = await db.select().from(schema.rewardQueue).where(
      and(eq(schema.rewardQueue.clientId, clientId), eq(schema.rewardQueue.stepId, stepId))
    );
    return result[0];
  }

  async bumpUserLastActive(userId: string): Promise<void> {
    await db.update(schema.users).set({ lastActiveAt: new Date() }).where(eq(schema.users.id, userId));
  }

  async createEngagementEvent(event: InsertEngagementEvent): Promise<EngagementEvent> {
    const result = await db.insert(schema.engagementEvents).values(event).returning();
    return result[0];
  }

  async createMarketplaceClick(click: InsertMarketplaceClick): Promise<MarketplaceClick> {
    const result = await db.insert(schema.marketplaceClicks).values(click).returning();
    return result[0];
  }

  async listAffiliateDeals(opts: { activeOnly?: boolean } = {}): Promise<schema.AffiliateDealRow[]> {
    const rows = opts.activeOnly
      ? await db.select().from(schema.affiliateDealsTable).where(eq(schema.affiliateDealsTable.status, 'active')).orderBy(asc(schema.affiliateDealsTable.sortOrder), asc(schema.affiliateDealsTable.id))
      : await db.select().from(schema.affiliateDealsTable).orderBy(asc(schema.affiliateDealsTable.sortOrder), asc(schema.affiliateDealsTable.id));
    return rows;
  }

  async getAffiliateDeal(id: string): Promise<schema.AffiliateDealRow | undefined> {
    const rows = await db.select().from(schema.affiliateDealsTable).where(eq(schema.affiliateDealsTable.id, id));
    return rows[0];
  }

  async createAffiliateDeal(input: schema.InsertAffiliateDeal): Promise<schema.AffiliateDealRow> {
    const result = await db.insert(schema.affiliateDealsTable).values(input).returning();
    return result[0];
  }

  async updateAffiliateDeal(id: string, patch: schema.UpdateAffiliateDeal): Promise<schema.AffiliateDealRow | undefined> {
    const result = await db.update(schema.affiliateDealsTable)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(schema.affiliateDealsTable.id, id))
      .returning();
    return result[0];
  }

  async deleteAffiliateDeal(id: string): Promise<boolean> {
    // Soft-delete: archive the row so historical click analytics keep
    // their tab attribution via affiliate_deals.tab.
    const result = await db.update(schema.affiliateDealsTable)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(schema.affiliateDealsTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getDealClickCounts(sinceDays: number): Promise<Record<string, number>> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await db.execute(sql`SELECT deal_id, COUNT(*)::int AS c FROM marketplace_clicks WHERE created_at > ${since} GROUP BY deal_id`);
    const out: Record<string, number> = {};
    for (const r of rows.rows as Array<Record<string, unknown>>) {
      out[String(r.deal_id)] = Number(r.c ?? 0);
    }
    return out;
  }

  async getAdminOverview() {
    type Row = Record<string, unknown>;
    const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    const str = (v: unknown): string => (v == null ? '' : String(v));
    const dealTabRows = await db.execute(sql`SELECT id, tab FROM affiliate_deals`);
    const dealTabMap: Record<string, string> = {};
    for (const r of dealTabRows.rows as Array<Record<string, unknown>>) {
      dealTabMap[String(r.id)] = String(r.tab);
    }
    const FINANCE = ['monzo', 'starling', 'revolut', 'wise', 'hargreaveslansdown', 'freetrade'];
    const PLAN_PRICE: Record<string, number> = { starter: 20, 'growth-1': 50, 'growth-2': 75, 'growth-3': 100 };

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day2 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().slice(0, 10);
    const yesterdayStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const userRoleRows = await db.execute(sql`SELECT role, COUNT(*)::int AS c FROM users GROUP BY role`);
    const roleCounts: Record<string, number> = {};
    for (const r of userRoleRows.rows as Row[]) roleCounts[str(r.role)] = num(r.c);

    const totalCompaniesRow = await db.execute(sql`SELECT COUNT(*)::int AS c FROM companies`);
    const liveNowRow = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users WHERE last_active_at > ${fiveMinAgo}`);
    const liveNowPrevRow = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users WHERE last_active_at > ${tenMinAgo} AND last_active_at <= ${fiveMinAgo}`);
    const active7Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users WHERE last_active_at > ${day7}`);
    const activeLast7Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users WHERE last_active_at > ${day14} AND last_active_at <= ${day7}`);
    const new7Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users WHERE created_at > ${day7}`);
    const new30Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users WHERE created_at > ${day30}`);

    // Per-day, per-role signup buckets for last 30 days
    const sigRows = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS day, role, COUNT(*)::int AS c
      FROM users WHERE created_at > ${day30}
      GROUP BY day, role ORDER BY day
    `);
    const signupMap: Record<string, { clients: number; brokers: number; companies: number; admins: number }> = {};
    for (const r of sigRows.rows as Row[]) {
      const day = str(r.day);
      const role = str(r.role);
      const c = num(r.c);
      if (!signupMap[day]) signupMap[day] = { clients: 0, brokers: 0, companies: 0, admins: 0 };
      if (role === 'client') signupMap[day].clients = c;
      else if (role === 'broker') signupMap[day].brokers = c;
      else if (role === 'company') signupMap[day].companies = c;
      else if (role === 'admin') signupMap[day].admins = c;
    }
    const signupsByDay: Array<{ date: string; clients: number; brokers: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const b = signupMap[key] || { clients: 0, brokers: 0, companies: 0, admins: 0 };
      signupsByDay.push({ date: key, clients: b.clients, brokers: b.brokers });
    }
    const today = signupMap[todayStr] || { clients: 0, brokers: 0, companies: 0, admins: 0 };
    const yest = signupMap[yesterdayStr] || { clients: 0, brokers: 0, companies: 0, admins: 0 };
    const totalSignupsToday = today.clients + today.brokers + today.companies + today.admins;
    const totalSignupsYest = yest.clients + yest.brokers + yest.companies + yest.admins;

    // Marketplace
    const c24Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM marketplace_clicks WHERE created_at > ${day1}`);
    const cPrev24Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM marketplace_clicks WHERE created_at > ${day2} AND created_at <= ${day1}`);
    const c7Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM marketplace_clicks WHERE created_at > ${day7}`);
    const c30Row = await db.execute(sql`SELECT COUNT(*)::int AS c FROM marketplace_clicks WHERE created_at > ${day30}`);
    const topRows = await db.execute(sql`
      SELECT deal_id, COUNT(*)::int AS c FROM marketplace_clicks
      WHERE created_at > ${day30}
      GROUP BY deal_id ORDER BY c DESC LIMIT 5
    `);
    const tabRows = await db.execute(sql`
      SELECT deal_id, COUNT(*)::int AS c FROM marketplace_clicks
      WHERE created_at > ${day30} GROUP BY deal_id
    `);
    let home = 0, finance = 0, leisure = 0;
    for (const r of tabRows.rows as Row[]) {
      const dealId = str(r.deal_id);
      const c = num(r.c);
      const tab = dealTabMap[dealId];
      if (tab === 'homeware') home += c;
      else if (tab === 'leisure') leisure += c;
      else if (FINANCE.includes(dealId)) finance += c;
    }

    // Subscriptions
    const planRows = await db.execute(sql`
      SELECT plan, growth_band, subscription_status AS status, COUNT(*)::int AS c FROM users
      WHERE plan IS NOT NULL GROUP BY plan, growth_band, subscription_status
    `);
    const byPlanMap: Record<string, number> = {};
    let activeStarter = 0, activeG1 = 0, activeG2 = 0, activeG3 = 0;
    let trialing = 0, cancelled = 0;
    let mrr = 0;
    for (const r of planRows.rows as Row[]) {
      const plan = str(r.plan);
      const band = r.growth_band == null ? null : num(r.growth_band);
      const status = str(r.status);
      const c = num(r.c);
      const key = `${plan}-${band ?? 'x'}`;
      byPlanMap[key] = (byPlanMap[key] || 0) + c;
      if (status === 'active') {
        if (plan === 'starter') { activeStarter += c; mrr += c * PLAN_PRICE.starter; }
        else if (plan === 'growth') {
          if (band === 1) { activeG1 += c; mrr += c * PLAN_PRICE['growth-1']; }
          else if (band === 2) { activeG2 += c; mrr += c * PLAN_PRICE['growth-2']; }
          else if (band === 3) { activeG3 += c; mrr += c * PLAN_PRICE['growth-3']; }
        }
      } else if (status === 'trialing') {
        trialing += c;
      } else if (status === 'canceled' || status === 'cancelled') {
        cancelled += c;
      }
    }
    const byPlan = Object.entries(byPlanMap).map(([k, count]) => {
      const [plan, bandStr] = k.split('-');
      return { plan, band: bandStr === 'x' ? null : Number(bandStr), count };
    });
    const statusRows = await db.execute(sql`
      SELECT subscription_status AS s, COUNT(*)::int AS c FROM users
      WHERE subscription_status IS NOT NULL GROUP BY s
    `);

    return {
      totalUsers: Object.values(roleCounts).reduce((s, n) => s + n, 0),
      totalClients: roleCounts.client || 0,
      totalBrokers: roleCounts.broker || 0,
      totalAdmins: roleCounts.admin || 0,
      totalCompanies: num((totalCompaniesRow.rows[0] as Row).c),
      liveNow: num((liveNowRow.rows[0] as Row).c),
      liveNowPrev5m: num((liveNowPrevRow.rows[0] as Row).c),
      activeThisWeek: num((active7Row.rows[0] as Row).c),
      activeLastWeek: num((activeLast7Row.rows[0] as Row).c),
      newSignups7d: num((new7Row.rows[0] as Row).c),
      newSignups30d: num((new30Row.rows[0] as Row).c),
      signupsToday: totalSignupsToday,
      signupsYesterday: totalSignupsYest,
      clientSignupsToday: today.clients,
      clientSignupsYesterday: yest.clients,
      brokerSignupsToday: today.brokers,
      brokerSignupsYesterday: yest.brokers,
      companySignupsToday: today.companies,
      companySignupsYesterday: yest.companies,
      signupsByDay,
      marketplace: {
        clicks24h: num((c24Row.rows[0] as Row).c),
        clicksPrev24h: num((cPrev24Row.rows[0] as Row).c),
        clicks7d: num((c7Row.rows[0] as Row).c),
        clicks30d: num((c30Row.rows[0] as Row).c),
        topDeals: (topRows.rows as Row[]).map((r) => ({ dealId: str(r.deal_id), clicks: num(r.c) })),
        byTab: { home, finance, leisure },
      },
      subscriptions: {
        byPlan,
        byStatus: (statusRows.rows as Row[]).map((r) => ({ status: str(r.s), count: num(r.c) })),
        activeStarter,
        activeGrowthBand1: activeG1,
        activeGrowthBand2: activeG2,
        activeGrowthBand3: activeG3,
        trialing,
        cancelled,
        mrrEstimate: mrr,
      },
    };
  }

  async getAllClientsAdmin() {
    type Row = Record<string, unknown>;
    const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    const str = (v: unknown): string => (v == null ? '' : String(v));
    const rows = await db.execute(sql`
      SELECT u.id AS user_id, u.email, u.name, u.created_at, u.last_active_at,
             c.id AS client_id, c.broker_user_id, c.status,
             b.name AS broker_name,
             COALESCE((SELECT COUNT(*)::int FROM journey_steps js WHERE js.client_id = c.id AND js.status = 'completed'), 0) AS completed_steps
      FROM users u
      LEFT JOIN clients c ON LOWER(c.email) = LOWER(u.email)
      LEFT JOIN users b ON b.id = c.broker_user_id
      WHERE u.role = 'client'
      ORDER BY u.created_at DESC
    `);
    return (rows.rows as Row[]).map((r) => ({
      userId: str(r.user_id),
      clientId: r.client_id == null ? null : num(r.client_id),
      name: str(r.name),
      email: str(r.email),
      status: r.status == null ? null : str(r.status),
      brokerUserId: r.broker_user_id == null ? null : str(r.broker_user_id),
      brokerName: r.broker_name == null ? null : str(r.broker_name),
      createdAt: r.created_at == null ? null : String(r.created_at),
      lastActiveAt: r.last_active_at == null ? null : String(r.last_active_at),
      completedSteps: num(r.completed_steps),
      totalSteps: 5,
    }));
  }

  async getAllBrokersAdmin() {
    type Row = Record<string, unknown>;
    const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    const str = (v: unknown): string => (v == null ? '' : String(v));
    const rows = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.broker_code, u.plan, u.growth_band, u.subscription_status,
             u.created_at, u.last_active_at, u.company_id,
             co.name AS company_name,
             (SELECT COUNT(*)::int FROM clients c WHERE c.broker_user_id = u.id) AS client_count
      FROM users u
      LEFT JOIN companies co ON co.id = u.company_id
      WHERE u.role = 'broker'
      ORDER BY u.created_at DESC
    `);
    return (rows.rows as Row[]).map((r) => ({
      id: str(r.id),
      name: str(r.name),
      email: str(r.email),
      brokerCode: r.broker_code == null ? null : str(r.broker_code),
      plan: r.plan == null ? null : str(r.plan),
      growthBand: r.growth_band == null ? null : num(r.growth_band),
      subscriptionStatus: r.subscription_status == null ? null : str(r.subscription_status),
      companyId: r.company_id == null ? null : num(r.company_id),
      companyName: r.company_name == null ? null : str(r.company_name),
      clientCount: num(r.client_count),
      createdAt: r.created_at == null ? null : String(r.created_at),
      lastActiveAt: r.last_active_at == null ? null : String(r.last_active_at),
    }));
  }

  async getAllCompaniesAdmin() {
    type Row = Record<string, unknown>;
    const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    const str = (v: unknown): string => (v == null ? '' : String(v));
    const rows = await db.execute(sql`
      SELECT co.id, co.name, co.company_code, co.contact_email, co.created_at,
             (SELECT COUNT(*)::int FROM users u WHERE u.company_id = co.id AND u.role = 'broker') AS broker_count,
             (SELECT COUNT(*)::int FROM clients c
              WHERE c.broker_user_id IN (SELECT id FROM users WHERE company_id = co.id AND role = 'broker')
             ) AS client_count
      FROM companies co
      ORDER BY co.created_at DESC
    `);
    return (rows.rows as Row[]).map((r) => ({
      id: num(r.id),
      name: str(r.name),
      companyCode: str(r.company_code),
      contactEmail: str(r.contact_email),
      brokerCount: num(r.broker_count),
      clientCount: num(r.client_count),
      createdAt: r.created_at == null ? null : String(r.created_at),
    }));
  }

  async getBrokerEngagementSummary(brokerUserId: string): Promise<{
    activeHomeowners: number;
    gainedThisMonth: number;
    activeThisMonthCount: number;
    activeThisMonthPct: number;
    clientActionsThisWeek: number;
    referralsCount: number;
    introductionsCount: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const brokerClients = await db.select().from(schema.clients).where(eq(schema.clients.brokerUserId, brokerUserId));
    const totalClients = brokerClients.length;
    // Active Homeowners = total clients linked to this broker's code (per spec)
    const activeHomeowners = totalClients;
    const gainedThisMonth = brokerClients.filter(c => c.createdAt && new Date(c.createdAt) >= startOfMonth).length;

    const clientIds = brokerClients.map(c => c.id);
    const clientEmailsLower = brokerClients.map(c => c.email.toLowerCase());

    // A client counts as "active this month" if any of these signals exist in the
    // current calendar month: their user account's lastActiveAt was bumped, OR
    // they opened a notification, read a broker message, completed a journey
    // step, booked an appointment, raised an enquiry, or generated an
    // engagement event. This widens the definition beyond just lastActiveAt
    // (which is null for clients who haven't signed in since the column
    // launched) so the rate reflects real engagement from day one.
    const activeClientIdsThisMonth = new Set<number>();
    if (clientIds.length > 0) {
      const emailToClientId = new Map<string, number>();
      for (const c of brokerClients) emailToClientId.set(c.email.toLowerCase(), c.id);

      const [activeUsers, notifSignals, msgSignals, stepSignals, apptSignals, enquirySignals, eventSignals] = await Promise.all([
        clientEmailsLower.length > 0
          ? db.select({ email: schema.users.email }).from(schema.users).where(
              and(
                inArray(sql`LOWER(${schema.users.email})`, clientEmailsLower),
                gte(schema.users.lastActiveAt, startOfMonth),
              )
            )
          : Promise.resolve([] as { email: string }[]),
        db.selectDistinct({ clientId: schema.notifications.clientId }).from(schema.notifications).where(
          and(
            inArray(schema.notifications.clientId, clientIds),
            eq(schema.notifications.read, true),
            gte(schema.notifications.createdAt, startOfMonth),
          )
        ),
        db.selectDistinct({ clientId: schema.messages.clientId }).from(schema.messages).where(
          and(
            inArray(schema.messages.clientId, clientIds),
            eq(schema.messages.senderType, "broker"),
            eq(schema.messages.read, true),
            gte(schema.messages.createdAt, startOfMonth),
          )
        ),
        db.selectDistinct({ clientId: schema.journeySteps.clientId }).from(schema.journeySteps).where(
          and(inArray(schema.journeySteps.clientId, clientIds), gte(schema.journeySteps.completedAt, startOfMonth))
        ),
        db.selectDistinct({ clientId: schema.clientAppointments.clientId }).from(schema.clientAppointments).where(
          and(inArray(schema.clientAppointments.clientId, clientIds), gte(schema.clientAppointments.createdAt, startOfMonth))
        ),
        db.selectDistinct({ clientId: schema.enquiries.clientId }).from(schema.enquiries).where(
          and(inArray(schema.enquiries.clientId, clientIds), gte(schema.enquiries.createdAt, startOfMonth))
        ),
        db.selectDistinct({ clientId: schema.engagementEvents.clientId }).from(schema.engagementEvents).where(
          and(inArray(schema.engagementEvents.clientId, clientIds), gte(schema.engagementEvents.createdAt, startOfMonth))
        ),
      ]);

      for (const u of activeUsers) {
        const cid = emailToClientId.get(u.email.toLowerCase());
        if (cid !== undefined) activeClientIdsThisMonth.add(cid);
      }
      for (const row of notifSignals) activeClientIdsThisMonth.add(row.clientId);
      for (const row of msgSignals) activeClientIdsThisMonth.add(row.clientId);
      for (const row of stepSignals) activeClientIdsThisMonth.add(row.clientId);
      for (const row of apptSignals) activeClientIdsThisMonth.add(row.clientId);
      for (const row of enquirySignals) activeClientIdsThisMonth.add(row.clientId);
      for (const row of eventSignals) activeClientIdsThisMonth.add(row.clientId);
    }
    const activeThisMonthCount = activeClientIdsThisMonth.size;
    const activeThisMonthPct = totalClients > 0 ? Math.round((activeThisMonthCount / totalClients) * 100) : 0;

    let clientActionsThisWeek = 0;
    if (clientIds.length > 0) {
      const [appts, completedSteps, enq, events, notifsOpened, msgsRead] = await Promise.all([
        // Appointments booked in last 7 days
        db.select({ id: schema.clientAppointments.id }).from(schema.clientAppointments).where(
          and(inArray(schema.clientAppointments.clientId, clientIds), gte(schema.clientAppointments.createdAt, sevenDaysAgo))
        ),
        // Journey steps completed in last 7 days
        db.select({ id: schema.journeySteps.id }).from(schema.journeySteps).where(
          and(inArray(schema.journeySteps.clientId, clientIds), gte(schema.journeySteps.completedAt, sevenDaysAgo))
        ),
        // Enquiries raised in last 7 days
        db.select({ id: schema.enquiries.id }).from(schema.enquiries).where(
          and(inArray(schema.enquiries.clientId, clientIds), gte(schema.enquiries.createdAt, sevenDaysAgo))
        ),
        // Calculator runs, mortgage option views, lesson views, marketplace views in last 7 days
        db.select({ id: schema.engagementEvents.id }).from(schema.engagementEvents).where(
          and(inArray(schema.engagementEvents.clientId, clientIds), gte(schema.engagementEvents.createdAt, sevenDaysAgo))
        ),
        // Notifications opened (read=true) in last 7 days — proxy by createdAt since no readAt column exists
        db.select({ id: schema.notifications.id }).from(schema.notifications).where(
          and(
            inArray(schema.notifications.clientId, clientIds),
            eq(schema.notifications.read, true),
            gte(schema.notifications.createdAt, sevenDaysAgo),
          )
        ),
        // Messages from broker that the client has read (read=true) in last 7 days
        db.select({ id: schema.messages.id }).from(schema.messages).where(
          and(
            inArray(schema.messages.clientId, clientIds),
            eq(schema.messages.senderType, "broker"),
            eq(schema.messages.read, true),
            gte(schema.messages.createdAt, sevenDaysAgo),
          )
        ),
      ]);
      clientActionsThisWeek =
        appts.length + completedSteps.length + enq.length + events.length + notifsOpened.length + msgsRead.length;
    }

    // Successful referrals only — exclude pending/rejected/cancelled. Also count rewardPaid as a positive signal.
    let referralsCount = 0;
    if (clientIds.length > 0) {
      const refRows = await db.select({ status: schema.referrals.status, rewardPaid: schema.referrals.rewardPaid })
        .from(schema.referrals)
        .where(inArray(schema.referrals.referrerClientId, clientIds));
      const excluded = new Set(["pending", "rejected", "cancelled"]);
      referralsCount = refRows.filter(r => r.rewardPaid === true || !excluded.has((r.status ?? "").toLowerCase())).length;
    }

    const introductionsCount = brokerClients.filter(c => c.referredByClientId !== null && c.referredByClientId !== undefined).length;

    return {
      activeHomeowners,
      gainedThisMonth,
      activeThisMonthCount,
      activeThisMonthPct,
      clientActionsThisWeek,
      referralsCount,
      introductionsCount,
    };
  }

  async getChecklistItems(month: string): Promise<schema.ChecklistItem[]> {
    return db.select()
      .from(schema.checklistItems)
      .where(eq(schema.checklistItems.month, month))
      .orderBy(asc(schema.checklistItems.sortOrder));
  }

  async getChecklistCompletions(clientId: number, month: string): Promise<schema.ChecklistCompletion[]> {
    const items = await db.select({ id: schema.checklistItems.id })
      .from(schema.checklistItems)
      .where(eq(schema.checklistItems.month, month));
    if (items.length === 0) return [];
    const itemIds = items.map(i => i.id);
    return db.select()
      .from(schema.checklistCompletions)
      .where(
        and(
          eq(schema.checklistCompletions.clientId, clientId),
          inArray(schema.checklistCompletions.itemId, itemIds),
        )
      );
  }

  async completeChecklistItem(clientId: number, itemId: number): Promise<schema.ChecklistCompletion> {
    const existing = await db.select()
      .from(schema.checklistCompletions)
      .where(
        and(
          eq(schema.checklistCompletions.clientId, clientId),
          eq(schema.checklistCompletions.itemId, itemId),
        )
      );
    if (existing.length > 0) return existing[0];
    const result = await db.insert(schema.checklistCompletions)
      .values({ clientId, itemId })
      .returning();
    return result[0];
  }

  async getClientTotalPoints(clientId: number): Promise<number> {
    const [earnedRows, giftSpentRows, drawSpentRows, charitySpentRows] = await Promise.all([
      db.select({ pts: sql<number>`COALESCE(SUM(${schema.checklistItems.points}), 0)` })
        .from(schema.checklistCompletions)
        .innerJoin(schema.checklistItems, eq(schema.checklistCompletions.itemId, schema.checklistItems.id))
        .where(eq(schema.checklistCompletions.clientId, clientId)),
      db.select({ pts: sql<number>`COALESCE(SUM(${schema.pointRedemptions.pointsSpent}), 0)` })
        .from(schema.pointRedemptions)
        .where(eq(schema.pointRedemptions.clientId, clientId)),
      db.execute(sql`SELECT COALESCE(SUM(points_spent), 0) AS pts FROM prize_draw_entries WHERE client_id = ${clientId}`),
      db.execute(sql`SELECT COALESCE(SUM(points_donated), 0) AS pts FROM charity_donations WHERE client_id = ${clientId}`),
    ]);
    const earned = Number(earnedRows[0]?.pts ?? 0);
    const giftSpent = Number(giftSpentRows[0]?.pts ?? 0);
    const drawSpent = Number((drawSpentRows.rows[0] as any)?.pts ?? 0);
    const charitySpent = Number((charitySpentRows.rows[0] as any)?.pts ?? 0);
    return Math.max(0, earned - giftSpent - drawSpent - charitySpent);
  }

  async uploadGiftCards(brandKey: string, brandLabel: string, faceValue: number, pointsCost: number, codes: Array<{ code: string; pin?: string }>): Promise<number> {
    if (codes.length === 0) return 0;
    // Upsert brand config
    await db.execute(sql`
      INSERT INTO gift_card_brands (brand_key, brand_label, face_value, points_cost, enabled)
      VALUES (${brandKey}, ${brandLabel}, ${faceValue.toFixed(2)}, ${pointsCost}, true)
      ON CONFLICT (brand_key) DO UPDATE SET
        brand_label = EXCLUDED.brand_label,
        face_value = EXCLUDED.face_value,
        points_cost = EXCLUDED.points_cost
    `);
    const rows = codes.map(c => ({
      brandKey,
      brandLabel,
      faceValue: faceValue.toFixed(2),
      pointsCost,
      code: c.code.trim(),
      pin: c.pin?.trim() || null,
    }));
    const result = await db.insert(schema.giftCards).values(rows).returning({ id: schema.giftCards.id });
    return result.length;
  }

  async getGiftCardStock(): Promise<Array<{ brandKey: string; brandLabel: string; faceValue: string; pointsCost: number; available: number; redeemed: number; enabled: boolean }>> {
    const result = await db.execute(sql`
      SELECT
        gc.brand_key,
        COALESCE(b.brand_label, MAX(gc.brand_label)) AS brand_label,
        COALESCE(b.face_value::text, MAX(gc.face_value)::text) AS face_value,
        COALESCE(b.points_cost, MAX(gc.points_cost)) AS points_cost,
        COALESCE(b.enabled, true) AS enabled,
        COUNT(*) FILTER (WHERE gc.redeemed_by_client_id IS NULL) AS available,
        COUNT(*) FILTER (WHERE gc.redeemed_by_client_id IS NOT NULL) AS redeemed
      FROM gift_cards gc
      LEFT JOIN gift_card_brands b ON b.brand_key = gc.brand_key
      GROUP BY gc.brand_key, b.brand_label, b.face_value, b.points_cost, b.enabled
      ORDER BY gc.brand_key
    `);
    return (result.rows as Array<Record<string, unknown>>).map(r => ({
      brandKey: String(r.brand_key ?? ''),
      brandLabel: String(r.brand_label ?? ''),
      faceValue: String(r.face_value ?? '0'),
      pointsCost: Number(r.points_cost ?? 0),
      available: Number(r.available ?? 0),
      redeemed: Number(r.redeemed ?? 0),
      enabled: Boolean(r.enabled ?? true),
    }));
  }

  async getGiftCardBrandCodes(brandKey: string): Promise<Array<{ id: number; code: string; pin: string | null; uploadedAt: Date; isAvailable: boolean }>> {
    const result = await db.execute(sql`
      SELECT id, code, pin, uploaded_at, (redeemed_by_client_id IS NULL) AS is_available
      FROM gift_cards
      WHERE brand_key = ${brandKey}
      ORDER BY uploaded_at ASC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      code: r.code,
      pin: r.pin ?? null,
      uploadedAt: r.uploaded_at,
      isAvailable: Boolean(r.is_available),
    }));
  }

  async updateGiftCardBrand(brandKey: string, brandLabel: string, faceValue: number, pointsCost: number, newCodes: Array<{ code: string; pin?: string }>): Promise<{ updatedCards: number; addedCodes: number }> {
    // Upsert brand config
    await db.execute(sql`
      INSERT INTO gift_card_brands (brand_key, brand_label, face_value, points_cost, enabled)
      VALUES (${brandKey}, ${brandLabel}, ${faceValue.toFixed(2)}, ${pointsCost}, true)
      ON CONFLICT (brand_key) DO UPDATE SET
        brand_label = EXCLUDED.brand_label,
        face_value = EXCLUDED.face_value,
        points_cost = EXCLUDED.points_cost
    `);
    // Update all unredeemed cards' metadata
    const updateResult = await db.execute(sql`
      UPDATE gift_cards
      SET brand_label = ${brandLabel}, face_value = ${faceValue.toFixed(2)}, points_cost = ${pointsCost}
      WHERE brand_key = ${brandKey} AND redeemed_by_client_id IS NULL
    `);
    // Add new codes if any
    let addedCodes = 0;
    if (newCodes.length > 0) {
      const rows = newCodes.map(c => ({
        brandKey,
        brandLabel,
        faceValue: faceValue.toFixed(2),
        pointsCost,
        code: c.code.trim(),
        pin: c.pin?.trim() || null,
      }));
      const inserted = await db.insert(schema.giftCards).values(rows).returning({ id: schema.giftCards.id });
      addedCodes = inserted.length;
    }
    return { updatedCards: Number((updateResult as any).rowCount ?? 0), addedCodes };
  }

  async toggleGiftCardBrand(brandKey: string, enabled: boolean): Promise<void> {
    await db.execute(sql`
      INSERT INTO gift_card_brands (brand_key, brand_label, face_value, points_cost, enabled)
      VALUES (${brandKey}, ${brandKey}, 5.00, 500, ${enabled})
      ON CONFLICT (brand_key) DO UPDATE SET enabled = ${enabled}
    `);
  }

  async claimGiftCard(brandKey: string, clientId: number, pointsCost: number): Promise<schema.GiftCard> {
    // Atomic: find one available card and claim it in a single UPDATE ... RETURNING
    const result = await db.execute(sql`
      UPDATE gift_cards
      SET redeemed_by_client_id = ${clientId}, redeemed_at = now()
      WHERE id = (
        SELECT id FROM gift_cards
        WHERE brand_key = ${brandKey} AND redeemed_by_client_id IS NULL
        ORDER BY uploaded_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `);
    const card = (result.rows as any[])[0];
    if (!card) throw new Error("OUT_OF_STOCK");
    // Record point debit
    await db.insert(schema.pointRedemptions).values({
      clientId,
      giftCardId: card.id,
      pointsSpent: pointsCost,
    });
    return {
      id: card.id,
      brandKey: card.brand_key,
      brandLabel: card.brand_label,
      faceValue: card.face_value,
      pointsCost: card.points_cost,
      code: card.code,
      pin: card.pin,
      redeemedByClientId: card.redeemed_by_client_id,
      redeemedAt: card.redeemed_at,
      uploadedAt: card.uploaded_at,
    };
  }

  async getClientRedeemedCards(clientId: number): Promise<Array<schema.GiftCard & { pointsSpent: number }>> {
    const result = await db.execute(sql`
      SELECT g.*, pr.points_spent
      FROM gift_cards g
      JOIN point_redemptions pr ON pr.gift_card_id = g.id
      WHERE g.redeemed_by_client_id = ${clientId}
      ORDER BY g.redeemed_at DESC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      brandKey: r.brand_key,
      brandLabel: r.brand_label,
      faceValue: r.face_value,
      pointsCost: r.points_cost,
      code: r.code,
      pin: r.pin,
      redeemedByClientId: r.redeemed_by_client_id,
      redeemedAt: r.redeemed_at,
      uploadedAt: r.uploaded_at,
      pointsSpent: Number(r.points_spent),
    }));
  }

  // ─── Prize Draws ─────────────────────────────────────────────────────────────

  async createPrizeDraw(data: InsertPrizeDraw): Promise<PrizeDraw> {
    const result = await db.insert(schema.prizeDraws).values(data).returning();
    return result[0];
  }

  async listPrizeDraws(): Promise<Array<PrizeDraw & { totalEntries: number; uniqueParticipants: number }>> {
    const result = await db.execute(sql`
      SELECT
        pd.*,
        COALESCE(SUM(pde.num_entries), 0) AS total_entries,
        COUNT(DISTINCT pde.client_id) AS unique_participants
      FROM prize_draws pd
      LEFT JOIN prize_draw_entries pde ON pde.draw_id = pd.id
      GROUP BY pd.id
      ORDER BY pd.created_at DESC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      prize: r.prize,
      pointsPerEntry: Number(r.points_per_entry),
      maxEntriesPerClient: r.max_entries_per_client ? Number(r.max_entries_per_client) : null,
      drawDate: r.draw_date,
      status: r.status,
      winnerEntryId: r.winner_entry_id ? Number(r.winner_entry_id) : null,
      winnerNotified: Boolean(r.winner_notified),
      createdAt: r.created_at,
      totalEntries: Number(r.total_entries),
      uniqueParticipants: Number(r.unique_participants),
    }));
  }

  async getPrizeDraw(id: number): Promise<PrizeDraw | undefined> {
    const result = await db.select().from(schema.prizeDraws).where(eq(schema.prizeDraws.id, id)).limit(1);
    return result[0];
  }

  async updatePrizeDraw(id: number, patch: Partial<Pick<PrizeDraw, 'status' | 'winnerEntryId' | 'winnerNotified' | 'title' | 'description' | 'prize' | 'pointsPerEntry' | 'maxEntriesPerClient' | 'drawDate'>>): Promise<PrizeDraw | undefined> {
    const result = await db.update(schema.prizeDraws).set(patch as Partial<typeof schema.prizeDraws.$inferInsert>).where(eq(schema.prizeDraws.id, id)).returning();
    return result[0];
  }

  async getActivePrizeDraw(): Promise<PrizeDraw | undefined> {
    const result = await db.select().from(schema.prizeDraws)
      .where(eq(schema.prizeDraws.status, 'active'))
      .orderBy(asc(schema.prizeDraws.createdAt))
      .limit(1);
    return result[0];
  }

  async enterPrizeDraw(drawId: number, clientId: number, numEntries: number): Promise<PrizeDrawEntry> {
    const draw = await this.getPrizeDraw(drawId);
    if (!draw || draw.status !== 'active') throw Object.assign(new Error('Draw not available'), { code: 'DRAW_NOT_ACTIVE' });
    const totalCost = draw.pointsPerEntry * numEntries;
    const balance = await this.getClientTotalPoints(clientId);
    if (balance < totalCost) throw Object.assign(new Error('Insufficient points'), { code: 'INSUFFICIENT_POINTS' });
    if (draw.maxEntriesPerClient !== null) {
      const existing = await this.getClientDrawEntries(drawId, clientId);
      if (existing + numEntries > draw.maxEntriesPerClient) {
        throw Object.assign(new Error('Exceeds max entries'), { code: 'MAX_ENTRIES_EXCEEDED' });
      }
    }
    const result = await db.insert(schema.prizeDrawEntries).values({
      drawId,
      clientId,
      numEntries,
      pointsSpent: totalCost,
    }).returning();
    return result[0];
  }

  async getDrawEntries(drawId: number): Promise<Array<PrizeDrawEntry & { clientName: string; clientEmail: string }>> {
    const result = await db.execute(sql`
      SELECT pde.*, u.name AS client_name, u.email AS client_email
      FROM prize_draw_entries pde
      JOIN clients c ON c.id = pde.client_id
      JOIN users u ON u.id = c.user_id
      WHERE pde.draw_id = ${drawId}
      ORDER BY pde.entered_at ASC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      drawId: r.draw_id,
      clientId: r.client_id,
      numEntries: Number(r.num_entries),
      pointsSpent: Number(r.points_spent),
      enteredAt: r.entered_at,
      clientName: r.client_name,
      clientEmail: r.client_email,
    }));
  }

  async getClientDrawEntries(drawId: number, clientId: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(num_entries), 0) AS total FROM prize_draw_entries
      WHERE draw_id = ${drawId} AND client_id = ${clientId}
    `);
    return Number((result.rows[0] as any)?.total ?? 0);
  }

  async pickDrawWinner(drawId: number): Promise<{ entry: PrizeDrawEntry; clientName: string; clientEmail: string } | null> {
    const entries = await this.getDrawEntries(drawId);
    if (entries.length === 0) return null;
    // Build weighted pool: each entry row contributes numEntries tickets
    const pool: typeof entries = [];
    for (const e of entries) {
      for (let i = 0; i < e.numEntries; i++) pool.push(e);
    }
    const winner = pool[Math.floor(Math.random() * pool.length)];
    await this.updatePrizeDraw(drawId, { status: 'drawn', winnerEntryId: winner.id });
    return { entry: winner, clientName: winner.clientName, clientEmail: winner.clientEmail };
  }

  // ─── Charities ───────────────────────────────────────────────────────────────

  async createCharity(data: InsertCharity): Promise<Charity> {
    const result = await db.insert(schema.charities).values(data).returning();
    return result[0];
  }

  async listCharities(activeOnly = false): Promise<Charity[]> {
    if (activeOnly) {
      return db.select().from(schema.charities)
        .where(eq(schema.charities.status, 'active'))
        .orderBy(asc(schema.charities.name));
    }
    return db.select().from(schema.charities).orderBy(asc(schema.charities.name));
  }

  async updateCharity(id: number, patch: Partial<InsertCharity>): Promise<Charity | undefined> {
    const result = await db.update(schema.charities).set(patch as Partial<typeof schema.charities.$inferInsert>).where(eq(schema.charities.id, id)).returning();
    return result[0];
  }

  async donateToCharity(charityId: number, clientId: number, pointsDonated: number): Promise<CharityDonation & { charityName: string }> {
    const charity = await db.select().from(schema.charities).where(eq(schema.charities.id, charityId)).limit(1);
    if (!charity[0] || charity[0].status !== 'active') throw Object.assign(new Error('Charity not available'), { code: 'CHARITY_UNAVAILABLE' });
    const poundValue = (pointsDonated / charity[0].pointsPerPound).toFixed(2);
    const balance = await this.getClientTotalPoints(clientId);
    if (balance < pointsDonated) throw Object.assign(new Error('Insufficient points'), { code: 'INSUFFICIENT_POINTS' });
    const result = await db.insert(schema.charityDonations).values({
      charityId,
      clientId,
      pointsDonated,
      poundValue,
      status: 'pending',
    }).returning();
    return { ...result[0], charityName: charity[0].name };
  }

  async listAllDonations(): Promise<Array<CharityDonation & { charityName: string; clientName: string; clientEmail: string }>> {
    const result = await db.execute(sql`
      SELECT cd.*, ch.name AS charity_name, u.name AS client_name, u.email AS client_email
      FROM charity_donations cd
      JOIN charities ch ON ch.id = cd.charity_id
      JOIN clients c ON c.id = cd.client_id
      JOIN users u ON u.id = c.user_id
      ORDER BY cd.donated_at DESC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      charityId: Number(r.charity_id),
      clientId: Number(r.client_id),
      pointsDonated: Number(r.points_donated),
      poundValue: String(r.pound_value),
      status: r.status,
      donatedAt: r.donated_at,
      charityName: r.charity_name,
      clientName: r.client_name,
      clientEmail: r.client_email,
    }));
  }

  async getCharityDonationTotals(): Promise<Array<{ charityId: number; charityName: string; totalPoints: number; totalPounds: string; pendingCount: number; fulfilledCount: number }>> {
    const result = await db.execute(sql`
      SELECT
        ch.id AS charity_id,
        ch.name AS charity_name,
        COALESCE(SUM(cd.points_donated), 0) AS total_points,
        COALESCE(SUM(cd.pound_value), 0) AS total_pounds,
        COUNT(*) FILTER (WHERE cd.status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE cd.status = 'fulfilled') AS fulfilled_count
      FROM charities ch
      LEFT JOIN charity_donations cd ON cd.charity_id = ch.id
      GROUP BY ch.id, ch.name
      ORDER BY total_points DESC
    `);
    return (result.rows as any[]).map(r => ({
      charityId: Number(r.charity_id),
      charityName: r.charity_name,
      totalPoints: Number(r.total_points),
      totalPounds: Number(r.total_pounds).toFixed(2),
      pendingCount: Number(r.pending_count),
      fulfilledCount: Number(r.fulfilled_count),
    }));
  }

  async markDonationsFulfilled(charityId: number): Promise<number> {
    const result = await db.execute(sql`
      UPDATE charity_donations SET status = 'fulfilled'
      WHERE charity_id = ${charityId} AND status = 'pending'
      RETURNING id
    `);
    return result.rows.length;
  }

  async getClientDonations(clientId: number): Promise<Array<CharityDonation & { charityName: string }>> {
    const result = await db.execute(sql`
      SELECT cd.*, ch.name AS charity_name
      FROM charity_donations cd
      JOIN charities ch ON ch.id = cd.charity_id
      WHERE cd.client_id = ${clientId}
      ORDER BY cd.donated_at DESC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      charityId: Number(r.charity_id),
      clientId: Number(r.client_id),
      pointsDonated: Number(r.points_donated),
      poundValue: String(r.pound_value),
      status: r.status,
      donatedAt: r.donated_at,
      charityName: r.charity_name,
    }));
  }

  async createBrokerSentReward(data: InsertBrokerSentReward): Promise<BrokerSentReward> {
    const result = await db.insert(schema.brokerSentRewards).values(data).returning();
    return result[0];
  }

  async getBrokerSentRewards(brokerUserId: string): Promise<Array<BrokerSentReward & { clientName: string; clientEmail: string }>> {
    type BrokerSentRewardRow = { id: string | number; broker_user_id: string; client_id: string | number; brand: string; value_gbp: string; status: string; created_at: Date; client_name: string; client_email: string };
    const result = await db.execute(sql`
      SELECT bsr.*, c.name AS client_name, c.email AS client_email
      FROM broker_sent_rewards bsr
      JOIN clients c ON c.id = bsr.client_id
      WHERE bsr.broker_user_id = ${brokerUserId}
      ORDER BY bsr.created_at DESC
    `);
    return (result.rows as BrokerSentRewardRow[]).map(r => ({
      id: Number(r.id),
      brokerUserId: r.broker_user_id,
      clientId: Number(r.client_id),
      brand: r.brand,
      valueGbp: String(r.value_gbp),
      status: r.status,
      createdAt: r.created_at,
      clientName: r.client_name,
      clientEmail: r.client_email,
    }));
  }

  async getClientBrokerRewards(clientId: number): Promise<BrokerSentReward[]> {
    type BrokerRewardRow = { id: string | number; broker_user_id: string; client_id: string | number; brand: string; value_gbp: string; status: string; created_at: Date };
    const result = await db.execute(sql`
      SELECT * FROM broker_sent_rewards
      WHERE client_id = ${clientId}
      ORDER BY created_at DESC
    `);
    return (result.rows as BrokerRewardRow[]).map(r => ({
      id: Number(r.id),
      brokerUserId: r.broker_user_id,
      clientId: Number(r.client_id),
      brand: r.brand,
      valueGbp: String(r.value_gbp),
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async getAllBrokerSentRewards(): Promise<Array<BrokerSentReward & { clientName: string; clientEmail: string; brokerName: string; brokerCredits: number }>> {
    type AllBrokerRewardRow = { id: string | number; broker_user_id: string; client_id: string | number; brand: string; value_gbp: string; status: string; created_at: Date; client_name: string; client_email: string; broker_name: string; broker_credits: string | number };
    const result = await db.execute(sql`
      SELECT bsr.*, c.name AS client_name, c.email AS client_email, u.name AS broker_name, u.reward_credits AS broker_credits
      FROM broker_sent_rewards bsr
      JOIN clients c ON c.id = bsr.client_id
      JOIN users u ON u.id = bsr.broker_user_id
      ORDER BY bsr.created_at DESC
    `);
    return (result.rows as AllBrokerRewardRow[]).map(r => ({
      id: Number(r.id),
      brokerUserId: r.broker_user_id,
      clientId: Number(r.client_id),
      brand: r.brand,
      valueGbp: String(r.value_gbp),
      status: r.status,
      createdAt: r.created_at,
      clientName: r.client_name,
      clientEmail: r.client_email,
      brokerName: r.broker_name,
      brokerCredits: Number(r.broker_credits ?? 0),
    }));
  }

  async grantSessionCreditsIdempotent(
    sessionId: string,
    userId: string,
    credits: number,
  ): Promise<{ granted: boolean; newBalance: number }> {
    // Single atomic statement: insert idempotency record and credit wallet.
    // The UPDATE only fires when the INSERT succeeds (i.e. first delivery).
    // On Stripe retries the INSERT is a no-op → UPDATE WHERE EXISTS is skipped
    // → credits are never double-granted. No two-step risk.
    const result = await db.execute(sql`
      WITH ins AS (
        INSERT INTO stripe_processed_sessions (session_id, user_id, credits_granted)
        VALUES (${sessionId}, ${userId}, ${credits})
        ON CONFLICT (session_id) DO NOTHING
        RETURNING session_id
      )
      UPDATE users
      SET reward_credits = reward_credits + ${credits}
      WHERE id = ${userId} AND EXISTS (SELECT 1 FROM ins)
      RETURNING reward_credits
    `);
    const row = (result.rows[0] as any);
    return {
      granted: !!row,
      newBalance: row ? Number(row.reward_credits) : 0,
    };
  }

  async addRewardCredits(userId: string, credits: number): Promise<number> {
    const result = await db.execute(sql`
      UPDATE users SET reward_credits = reward_credits + ${credits} WHERE id = ${userId} RETURNING reward_credits
    `);
    return Number((result.rows[0] as any)?.reward_credits ?? 0);
  }

  async getPriceIdForCreditPack(credits: number): Promise<string | null> {
    const creditsStr = String(credits);
    try {
      const result: any = await db.execute(sql`
        SELECT pr.id AS id
        FROM stripe.prices pr
        LEFT JOIN stripe.products p ON p.id = pr.product
        WHERE pr.active = true
          AND pr.recurring IS NULL
          AND COALESCE(pr.metadata->>'type', p.metadata->>'type') = 'reward_credit_pack'
          AND COALESCE(pr.metadata->>'credits', p.metadata->>'credits') = ${creditsStr}
        ORDER BY pr.created DESC
        LIMIT 1
      `);
      return result.rows?.[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  async createBrokerSentRewardAndDeductCredit(
    brokerUserId: string,
    clientId: number,
    brand: string,
    valueGbp: string,
  ): Promise<{ reward: BrokerSentReward; creditsRemaining: number } | { error: 'insufficient_credits' }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const deductResult = await client.query(
        `UPDATE users SET reward_credits = reward_credits - 1
         WHERE id = $1 AND reward_credits > 0
         RETURNING reward_credits`,
        [brokerUserId],
      );
      if (deductResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'insufficient_credits' };
      }
      const creditsRemaining = Number(deductResult.rows[0].reward_credits);
      const rewardResult = await client.query(
        `INSERT INTO broker_sent_rewards (broker_user_id, client_id, brand, value_gbp, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [brokerUserId, clientId, brand, valueGbp],
      );
      await client.query('COMMIT');
      const r = rewardResult.rows[0];
      return {
        reward: {
          id: Number(r.id),
          brokerUserId: r.broker_user_id,
          clientId: Number(r.client_id),
          brand: r.brand,
          valueGbp: String(r.value_gbp),
          status: r.status,
          createdAt: r.created_at,
        },
        creditsRemaining,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateBrokerSentRewardStatus(id: number, status: string): Promise<BrokerSentReward | undefined> {
    type UpdateRow = { id: string | number; broker_user_id: string; client_id: string | number; brand: string; value_gbp: string; status: string; created_at: Date };
    const result = await db.execute(sql`
      UPDATE broker_sent_rewards SET status = ${status} WHERE id = ${id} RETURNING *
    `);
    const r = result.rows[0] as UpdateRow | undefined;
    if (!r) return undefined;
    return {
      id: Number(r.id),
      brokerUserId: r.broker_user_id,
      clientId: Number(r.client_id),
      brand: r.brand,
      valueGbp: String(r.value_gbp),
      status: r.status,
      createdAt: r.created_at,
    };
  }
}

export const storage = new DatabaseStorage();
