export const prerender = false;

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
    const { system, userMessage } = buildPrompt(text, platform, filterIntensity);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system,
        messages:   [{ role: 'user', content: userMessage }],
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
    const raw = (data.content?.[0]?.text ?? '').trim();
    // Model outputs "KEEP" when content needs no change — return original
    rewritten = raw === 'KEEP' ? text : raw;
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

// ── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(
  text: string,
  platform: string,
  filterIntensity: string,
): { system: string; userMessage: string } {

  const system = `You are a calm editorial translator. You read social media posts, headlines, and articles, then decide whether they contain manipulation. If they do, you rewrite them. If they don't, you leave them alone.

You are NOT a censor. You are NOT a fact-checker. The information always survives — only the manipulation is removed.

STRIP these patterns:
- Sensationalism and hyperbole ("DESTROYING", "SHOCKING", "HORRIFYING", "devastating blow")
- ALL CAPS used for emotional amplification
- False urgency ("BREAKING", "RIGHT NOW", "HAPPENING NOW", "you need to see this immediately")
- Manufactured outrage and rage-bait designed to provoke anger or fear
- Pile-on language implying false consensus ("everyone is furious", "people can't believe", "the internet is losing it", "nobody can understand why")
- Clickbait withholding — if a headline deliberately hides the key fact to force a click, state the fact directly

PRESERVE these things completely:
- All factual claims and specific details
- Genuine emotion: joy, grief, love, humour, personal distress, excitement
- Personal updates and human moments ("my dad passed away", "just got engaged")
- The author's conclusion or opinion, stated calmly
- Dry wit and irony — these are not manipulation

WHEN TO OUTPUT "KEEP":
If the text contains no manipulation — it is already calm, factual, or personal — output the single word KEEP and nothing else. Do not rewrite content that doesn't need it.

OUTPUT FORMAT:
- If rewriting: plain text only. No quotes, no preamble, no explanation.
- If keeping: the word KEEP (uppercase, nothing else).`;

  const context: Record<string, string> = {
    twitter: 'a post on X/Twitter',
    reddit:  'a Reddit post or title',
    news:    'a news headline or article paragraph',
    google:  'a search result title',
  };

  const intensity: Record<string, string> = {
    light:    'Be conservative. Only rewrite if the manipulation is very clear and unambiguous. When in doubt, output KEEP.',
    balanced: '',
    deep:     'Apply extra scrutiny. Also rewrite mild loaded language, ambiguous framing, and implied urgency — not just obvious manipulation.',
  };

  const ctx  = context[platform]  ?? 'a social media post';
  const ins  = intensity[filterIntensity] ?? '';

  const examples = `Here are examples of correct behaviour:

Input: "This will DESTROY everything we've built. Experts are HORRIFIED."
Output: Experts have raised serious concerns.

Input: "🚨BREAKING🚨 Something MASSIVE is happening RIGHT NOW and you need to see this"
Output: A significant development has been reported.

Input: "Everyone is furious. People across the country can't believe what they just admitted."
Output: A recent admission has drawn criticism.

Input: "You won't BELIEVE what this politician just said 😱"
Output: A politician made a notable statement.

Input: "Scientists discover TERRIFYING truth about everyday household items"
Output: Researchers have identified potential risks in some common household items.

Input: "My dad passed away this morning. He was the kindest person I've ever known."
Output: KEEP

Input: "New study finds moderate coffee consumption linked to lower risk of type 2 diabetes."
Output: KEEP

---
Now process the following ${ctx}.${ins ? '\n' + ins : ''}

Text:
${text}`;

  return { system, userMessage: examples };
}
