import { createClient } from "@supabase/supabase-js";

/**
 * The browser's own client, used only to upload a photograph straight to
 * Storage — the file is far larger than a Server Action will accept.
 *
 * Separate from `lib/supabase.ts` because that module states it runs only on
 * the server, and importing it here would quietly make that untrue. Both use
 * the same publishable key, which is public by design.
 */
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

export const supabaseBrowser = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
