import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

type StripeEvent = {
  type: string;
  data: { object: any };
};

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: payload must be a Buffer. Ensure the webhook route is registered BEFORE app.use(express.json()).'
      );
    }
    const sync = await getStripeSync();
    const event: StripeEvent = await sync.processWebhook(payload, signature);
    // Let app-side update errors propagate so the webhook returns a non-2xx and
    // Stripe retries with backoff. The sync layer is idempotent.
    await applyAppSideUpdates(event);
  }
}

async function applyAppSideUpdates(event: StripeEvent) {
  if (!event?.type) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      if (session.metadata?.type !== 'reward_credits') break;
      // Only grant credits for fully paid sessions
      if (session.payment_status !== 'paid') {
        console.warn('[webhook] reward_credits session not paid, skipping:', session.id, session.payment_status);
        break;
      }
      // Resolve the broker by Stripe customer ID first (authoritative), then metadata fallback
      let brokerUserId: string | undefined;
      if (session.customer) {
        const brokerUser = await storage.getUserByStripeCustomerId(session.customer);
        brokerUserId = brokerUser?.id;
      }
      if (!brokerUserId) {
        brokerUserId = session.metadata?.brokerUserId;
      }
      if (!brokerUserId) {
        console.error('[webhook] reward_credits: could not resolve broker for session', session.id);
        break;
      }
      // Derive credits from purchased product metadata (authoritative source).
      // Fall back to session metadata if line items can't be retrieved.
      let creditsToAdd = 0;
      try {
        const stripe = await getUncachableStripeClient();
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
          limit: 10,
        });
        for (const item of lineItems.data) {
          const price = item.price as any;
          const product = price?.product as any;
          const meta = product?.metadata ?? price?.metadata ?? {};
          if (meta.type === 'reward_credit_pack' && meta.credits) {
            creditsToAdd += Number(meta.credits) * (item.quantity || 1);
          }
        }
      } catch (err) {
        console.error('[webhook] Could not retrieve line items, falling back to session metadata', err);
      }
      // Fallback: use session metadata credits if product lookup returned nothing
      if (creditsToAdd === 0) {
        const fallback = parseInt(session.metadata?.credits || '0', 10);
        if (fallback > 0) creditsToAdd = fallback;
      }
      if (creditsToAdd <= 0) {
        console.error('[webhook] reward_credits: could not determine credits for session', session.id);
        break;
      }
      // Atomically record the session and credit the wallet in one SQL statement.
      // If the session_id already exists (Stripe retry), the INSERT is a no-op
      // and the UPDATE WHERE EXISTS is skipped — credits are never double-granted.
      const { granted, newBalance } = await storage.grantSessionCreditsIdempotent(
        session.id,
        brokerUserId,
        creditsToAdd,
      );
      if (!granted) {
        console.log('[webhook] reward_credits: session already processed, skipping:', session.id);
        break;
      }
      console.log(`[webhook] reward_credits: granted ${creditsToAdd} credits to broker ${brokerUserId} (session ${session.id}, new balance ${newBalance})`);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.trial_will_end':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      const customerId: string | undefined = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
      if (!customerId) return;

      const status: string = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
      const item = sub.items?.data?.[0];
      const priceId: string | undefined = item?.price?.id;

      let plan: string | null = null;
      let growthBand: number | null = null;
      if (priceId) {
        const meta = await storage.getPlanMetadataForPrice(priceId);
        plan = meta?.plan ?? null;
        growthBand = meta?.band ?? null;
      }

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) return;

      await storage.updateUserStripeInfo(user.id, {
        stripeSubscriptionId: event.type === 'customer.subscription.deleted' ? null : sub.id,
        subscriptionStatus: status,
        plan: plan ?? user.plan ?? null,
        growthBand: growthBand ?? user.growthBand ?? null,
      });
      break;
    }
    default:
      break;
  }
}
