import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  "https://irikmbaezbvszzwsdzrt.supabase.co";

export const SUPABASE_ANON_KEY =
  "sb_publishable_ZYv-rNF7GJupNvwcop-evg_H3gC0BVq";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);