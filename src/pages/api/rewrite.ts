import type { APIRoute } from 'astro';
import { verifyJwt, createServiceClient } from '../../lib/supabase';
import { TIER_LIMITS, currentPeriod } from '../../lib/tiers';
import type { Tier } from '../../lib/tiers';

// CORS headers — required so the Chrome extension can call this endpoint.
// Chrome extensions send requests from a chrome-extension:// origin.
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const userId = await verifyJwt(request.headers.get('Authorization'));
  if (!userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createServiceClient();

  // ── 2. Subscription check ──────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (!sub) {
    return new Response(JSON.stringify({ error: 'no_subscription' }), {
      status: 402, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const tier = sub.tier as Tier;
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.basic;
  const period = currentPeriod();

  // ── 3. Usage check ─────────────────────────────────────────────────────────
  const { data: usageRow } = await supabase
    .from('usage')
    .select('rewrite_count')
    .eq('user_id', userId)
    .eq('period', period)
    .maybeSingle();

  const used = usageRow?.rewrite_count ?? 0;

  if (used >= limit) {
    return new Response(JSON.stringify({ error: 'limit_reached', used, limit }), {
      status: 429, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 4. Parse request body ──────────────────────────────────────────────────
  let text: string;
  let platform: string;
  let filterIntensity: string;

  try {
    const body = await request.json();
    text            = body.text;
    platform        = body.platform ?? 'twitter';
    filterIntensity = body.filterIntensity ?? 'balanced';
    if (!text || typeof text !== 'string') throw new Error('invalid text');
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 5. Anthropic call ──────────────────────────────────────────────────────
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[Devoke] Missing ANTHROPIC_API_KEY');
    return new Response(JSON.stringify({ error: 'api_error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let rewritten: string;

  try {
    const prompt = buildPrompt(text, platform, filterIntensity);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Devoke] Anthropic error:', err);
      return new Response(JSON.stringify({ error: 'api_error' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    rewritten = data.content?.[0]?.text ?? text;
  } catch (err) {
    console.error('[Devoke] Fetch error:', err);
    return new Response(JSON.stringify({ error: 'api_error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 6. Increment usage ─────────────────────────────────────────────────────
  await supabase.from('usage').upsert(
    { user_id: userId, period, rewrite_count: used + 1 },
    { onConflict: 'user_id,period' }
  );

  // ── 7. Return ──────────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({ success: true, rewritten }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
  );
};

// ── Prompt builder (mirrors background.js logic) ───────────────────────────

function buildPrompt(text: string, platform: string, filterIntensity: string): string {
  const context: Record<string, string> = {
    twitter: 'a social media post on X/Twitter',
    reddit:  'a Reddit post or title',
    news:    'a news article headline or paragraph',
    google:  'a search result title',
  };

  const intensity: Record<string, string> = {
    light:    'Only rewrite if the manipulation is unambiguous. When in doubt, return the text unchanged.',
    balanced: '',
    deep:     'Also rewrite mild loaded language, ambiguous framing, and passive sensationalism.',
  };

  const ctx = context[platform] ?? 'a social media post';
  const ins = intensity[filterIntensity] ?? '';

  return `You are a calm editorial filter. You will be given ${ctx}.

Rewrite it to remove:
- Sensationalism and hyperbole
- ALL CAPS used for emotional amplification
- Manufactured outrage and rage-bait
- Emotional manipulation designed to provoke clicks

Preserve:
- All factual information
- Genuine emotion (joy, grief, humour)
- Personal updates and human moments
- The original meaning

Flag unverified or contested claims with [unverified claim] at the start.
If the text is already calm and factual, return it unchanged.
${ins}
Return plain text only. No preamble, no explanation, no quotes.

Text to process:
${text}`;
}
