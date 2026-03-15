export const prerender = false;

import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../lib/supabase';
import { getStripe } from '../../../lib/stripe';
import { tierFromPriceId } from '../../../lib/tiers';
import type Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  // Verify webhook signature
  const signature = request.headers.get('stripe-signature');
  if (!signature || !secret) {
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('[Devoke] Webhook signature failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      // ── New subscription (after checkout or trial start) ──────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = session.subscription_data?.metadata?.supabase_user_id
          ?? session.metadata?.supabase_user_id
          ?? subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const subscriptionId = session.subscription as string;
        const subscription   = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId        = subscription.items.data[0]?.price.id ?? '';

        await supabase.from('subscriptions').upsert({
          user_id:                userId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id:        priceId,
          status:                 subscription.status,
          tier:                   tierFromPriceId(priceId),
          current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
          trial_end:              subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          updated_at:             new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
        break;
      }

      // ── Subscription updated (upgrade, downgrade, renewal) ────────────────
      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id ?? '';
        const userId  = sub.metadata?.supabase_user_id;

        if (!userId) break;

        await supabase
          .from('subscriptions')
          .update({
            status:             sub.status,
            tier:               tierFromPriceId(priceId),
            stripe_price_id:    priceId,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            trial_end:          sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            updated_at:         new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // ── Subscription canceled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription);
        break;
      }
    }
  } catch (err) {
    console.error('[Devoke] Webhook handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
