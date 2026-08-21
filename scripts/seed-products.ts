import { getUncachableStripeClient } from '../server/stripeClient';

const TRIAL_DAYS = 14;

type PlanSpec = {
  productName: string;
  description: string;
  amount: number;
  metadata: Record<string, string>;
};

const PLANS: PlanSpec[] = [
  {
    productName: 'Uprosper Starter',
    description: 'For independent brokers building their book.',
    amount: 2000,
    metadata: { plan: 'starter' },
  },
  {
    productName: 'Uprosper Growth (1–5 brokers)',
    description: 'Growth tier — small firm (1 to 5 brokers).',
    amount: 5000,
    metadata: { plan: 'growth', band: '1' },
  },
  {
    productName: 'Uprosper Growth (5–10 brokers)',
    description: 'Growth tier — mid firm (5 to 10 brokers).',
    amount: 7500,
    metadata: { plan: 'growth', band: '2' },
  },
  {
    productName: 'Uprosper Growth (10+ brokers)',
    description: 'Growth tier — larger firm (10+ brokers).',
    amount: 10000,
    metadata: { plan: 'growth', band: '3' },
  },
];

async function ensurePlan(spec: PlanSpec) {
  const stripe = await getUncachableStripeClient();
  const found = await stripe.products.search({
    query: `name:'${spec.productName}' AND active:'true'`,
  });

  let product = found.data[0];
  if (!product) {
    product = await stripe.products.create({
      name: spec.productName,
      description: spec.description,
      metadata: spec.metadata,
    });
    console.log(`Created product: ${product.name} (${product.id})`);
  } else {
    await stripe.products.update(product.id, { metadata: spec.metadata });
    console.log(`Product exists: ${product.name} (${product.id})`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const match = prices.data.find(
    (p) => p.unit_amount === spec.amount && p.currency === 'gbp' && p.recurring?.interval === 'month'
  );

  if (match) {
    console.log(`  Price exists: £${(spec.amount / 100).toFixed(2)}/mo (${match.id})`);
    return;
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: spec.amount,
    currency: 'gbp',
    recurring: { interval: 'month', trial_period_days: TRIAL_DAYS },
    metadata: spec.metadata,
  });
  console.log(`  Created price: £${(spec.amount / 100).toFixed(2)}/mo (${price.id})`);
}

async function main() {
  console.log('Seeding Uprosper plans into Stripe...');
  for (const spec of PLANS) {
    await ensurePlan(spec);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('seed-products failed:', err);
  process.exit(1);
});
