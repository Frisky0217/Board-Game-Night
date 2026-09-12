import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
  );
}

// v1 has no accounts, so there is no per-user auth state to keep isolated and a
// single shared client is safe. Session persistence is off because this client
// only ever runs on the server, where there is nothing to persist to.
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
