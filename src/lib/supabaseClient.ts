import { createClient } from "@supabase/supabase-js";

// Provide safe, non-crashing placeholder defaults so React can initialize even if env variables are empty
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
