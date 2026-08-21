import { getUncachableStripeClient } from '../server/stripeClient';

const COUPON_ID = 'LIVETEST_99_5_OFF';
const PROMO_CODE = 'LIVETEST';

async function main() {
  const stripe = await getUncachableStripeClient();

  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(COUPON_ID);
    console.log(`Coupon exists: ${coupon.id} (${coupon.percent_off}% off, ${coupon.duration})`);
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.code === 'resource_missing') {
      coupon = await stripe.coupons.create({
        id: COUPON_ID,
        percent_off: 99.5,
        duration: 'once',
        name: 'Live test — 99.5% off first charge',
      });
      console.log(`Created coupon: ${coupon.id} (99.5% off, once)`);
    } else {
      throw err;
    }
  }

  const existing = await stripe.promotionCodes.list({ code: PROMO_CODE, limit: 1 });
  if (existing.data.length > 0) {
    const pc = existing.data[0];
    console.log(`Promotion code exists: ${pc.code} → ${pc.coupon.id} (id=${pc.id}, active=${pc.active}, redemptions=${pc.times_redeemed}/${pc.max_redemptions ?? '∞'})`);
  } else {
    const pc = await stripe.promotionCodes.create({
      code: PROMO_CODE,
      coupon: COUPON_ID,
      max_redemptions: 5,
    });
    console.log(`Created promotion code: ${pc.code} → ${pc.coupon.id} (id=${pc.id}, max 5 redemptions)`);
  }

  console.log('\nDone. Use code LIVETEST at Stripe Checkout → "Add promotion code".');
}

main().catch((err) => {
  console.error('create-test-promo failed:', err);
  process.exit(1);
});
