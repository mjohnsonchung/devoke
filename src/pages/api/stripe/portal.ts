export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyJwt, createServiceClient } from '../../../lib/supabase';
import { getStripe } from '../../../lib/stripe';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization',
};

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  const userId = await verifyJwt(request.headers.get('Authorization'));
  if (!userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: 'no_customer' }), {
      status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const stripe  = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer:   profile.stripe_customer_id,
    return_url: 'https://devoke.app/dashboard',
  });

  return new Response(
    JSON.stringify({ url: session.url }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
  );
};
