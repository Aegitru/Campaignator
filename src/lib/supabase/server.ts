import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase serveur. Type lache (any) car notre schema Database custom
 * casse les Insert/Update genere par supabase-js. On preferera la simplicite ici.
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
