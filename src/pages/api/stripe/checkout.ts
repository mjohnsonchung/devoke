export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyJwt, createServiceClient } from '../../../lib/supabase';
import { getStripe } from '../../../lib/stripe';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  try {
    const userId = await verifyJwt(request.headers.get('Authorization'));
    if (!userId) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    let priceId: string;
    try {
      const body = await request.json();
      priceId = body.priceId;
      if (!priceId) throw new Error('missing priceId');
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_request' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();
    const stripe   = getStripe();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    // Get user email from auth
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authData?.user?.email;

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Checkout Session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer:                  customerId,
      mode:                      'subscription',
      line_items:                [{ price: priceId, quantity: 1 }],
      trial_period_days:         7,
      payment_method_collection: 'always',
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
      success_url: `https://devoke.app/dashboard?checkout=success`,
      cancel_url:  `https://devoke.app/pricing?checkout=canceled`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Devoke] checkout error:', err);
    return new Response(
      JSON.stringify({ error: err?.message ?? 'server_error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
};
