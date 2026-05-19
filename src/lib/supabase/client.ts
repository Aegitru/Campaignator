"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client Supabase pour le navigateur (lecture publique uniquement).
 * Pour l'écriture, passer par une Server Action / Route Handler
 * qui utilise le client server avec la service_role key.
 */
export const supabaseBrowser = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: { persistSession: false },
  }
);
