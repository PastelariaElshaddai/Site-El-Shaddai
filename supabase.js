const SUPABASE_URL="https://qjwojyxfktabdkbiryfx.supabase.co";
const SUPABASE_KEY="sb_publishable_eJ_vgt25nzDANKPq1jFW0g_EGnji9oG";
(function(){
  if(!window.supabase || typeof window.supabase.createClient!=="function"){console.error("Biblioteca Supabase não carregada.");return;}
  if(!window.supabaseClient)window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
})();
