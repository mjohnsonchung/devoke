import { createClient } from '@supabase/supabase-js';

// Server-side client — uses service role key, bypasses RLS.
// Only import this in API routes, never in client-side code.
export function createServiceClient() {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('[Devoke] Missing Supabase service role env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Browser-safe client — uses anon key, respects RLS.
export function createBrowserClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('[Devoke] Missing Supabase public env vars');
  return createClient(url, key);
}

// Verify a JWT from the Authorization header and return the user ID.
// Returns null if the token is invalid or expired.
export async function verifyJwt(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
