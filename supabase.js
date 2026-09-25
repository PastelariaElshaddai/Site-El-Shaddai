// Conexão do projeto existente — não criar outro Supabase.
const SUPABASE_URL = "https://qjwojyxfktabdkbiryfx.supabase.co";
const SUPABASE_KEY = "sb_publishable_eJ_vgt25nzDANKPq1jFW0g_EGnji9oG";

if (!window.supabase) {
  console.error("Supabase JS não carregado.");
} else {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
