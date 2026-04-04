import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://khsgclhokgebnlxulzpx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not set — database operations will fail");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
