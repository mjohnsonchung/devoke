export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyJwt, createServiceClient } from '../../lib/supabase';
import { TIER_LIMITS, currentPeriod } from '../../lib/tiers';
import type { Tier } from '../../lib/tiers';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization',
};

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = async ({ request }) => {
  const userId = await verifyJwt(request.headers.get('Authorization'));
  if (!userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createServiceClient();
  const period   = currentPeriod();

  const [{ data: sub }, { data: usageRow }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('tier, status, current_period_end, trial_end')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('usage')
      .select('rewrite_count')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle(),
  ]);

  const tier   = (sub?.tier ?? 'basic') as Tier;
  const used   = usageRow?.rewrite_count ?? 0;
  const limit  = TIER_LIMITS[tier];

  return new Response(
    JSON.stringify({
      used,
      limit,
      tier:      sub?.tier ?? null,
      status:    sub?.status ?? 'none',
      periodEnd: sub?.current_period_end ?? null,
      trialEnd:  sub?.trial_end ?? null,
    }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
  );
};
