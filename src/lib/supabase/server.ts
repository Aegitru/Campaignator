import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Client Supabase pour Server Actions / Route Handlers.
 * Utilise la service_role key — JAMAIS exposer côté client.
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
