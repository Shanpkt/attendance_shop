import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://irikmbaezbvszzwsdzrt.supabase.co";
const supabaseKey = "sb_publishable_ZYv-rNF7GJupNvwcop-evg_H3gC0BVq";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);