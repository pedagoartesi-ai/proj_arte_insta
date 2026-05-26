import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

export function getSupabaseAdminClient() {
  const { configured, url, serviceRoleKey } = getSupabaseConfig();
  if (!configured) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
