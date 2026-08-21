import { getUncachableStripeClient } from '../server/stripeClient';

type PackSpec = {
  productName: string;
  description: string;
  amount: number;
  credits: number;
};

const PACKS: PackSpec[] = [
  {
    productName: 'Uprosper Reward Credits — 1 pack',
    description: '1 gift card credit (£5) to send to your clients',
    amount: 500,
    credits: 1,
  },
  {
    productName: 'Uprosper Reward Credits — 5 pack',
    description: '5 gift card credits (£5 each) to send to your clients',
    amount: 2500,
    credits: 5,
  },
  {
    productName: 'Uprosper Reward Credits — 10 pack',
    description: '10 gift card credits (£5 each) to send to your clients',
    amount: 5000,
    credits: 10,
  },
];

async function ensurePack(spec: PackSpec) {
  const stripe = await getUncachableStripeClient();
  const found = await stripe.products.search({
    query: `name:'${spec.productName}' AND active:'true'`,
  });

  let product = found.data[0];
  const productMeta = { type: 'reward_credit_pack', credits: String(spec.credits) };

  if (!product) {
    product = await stripe.products.create({
      name: spec.productName,
      description: spec.description,
      metadata: productMeta,
    });
    console.log(`Created product: ${product.name} (${product.id})`);
  } else {
    await stripe.products.update(product.id, { metadata: productMeta });
    console.log(`Product exists: ${product.name} (${product.id})`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const match = prices.data.find(
    (p) => p.unit_amount === spec.amount && p.currency === 'gbp' && !p.recurring
  );

  if (match) {
    console.log(`  Price exists: £${(spec.amount / 100).toFixed(2)} one-time (${match.id})`);
    return;
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: spec.amount,
    currency: 'gbp',
    metadata: productMeta,
  });
  console.log(`  Created price: £${(spec.amount / 100).toFixed(2)} one-time (${price.id})`);
}

async function main() {
  console.log('Seeding Uprosper reward credit packs into Stripe...');
  for (const spec of PACKS) {
    await ensurePack(spec);
  }
  console.log('Done. Run this script again anytime — it is idempotent.');
  console.log('After seeding, the checkout endpoint resolves price IDs from Stripe metadata.');
}

main().catch((err) => {
  console.error('seed-reward-credit-products failed:', err);
  process.exit(1);
});
