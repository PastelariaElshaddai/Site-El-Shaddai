(function(){
  "use strict";
  const SUPABASE_URL="https://qjwojyxfktabdkbiryfx.supabase.co";
  const SUPABASE_KEY="sb_publishable_eJ_vgt25nzDANKPq1jFW0g_EGnji9oG";
  if(!window.supabase||typeof window.supabase.createClient!=="function"){
    console.error("Biblioteca do Supabase não carregada.");
    window.__ELSHADDAI_SUPABASE_ERROR__="Biblioteca do Supabase não carregada.";
    return;
  }
  window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  window.__ELSHADDAI_SUPABASE_READY__=true;
  window.__ELSHADDAI_SUPABASE_URL__=SUPABASE_URL;
})();
async function carregarProdutosSupabase(){const {data,error}=await window.supabaseClient.from("produtos").select("*").eq("ativo",true).order("id");if(error){console.error(error);return []}return data||[]}
async function carregarCategoriasSupabase(){const {data,error}=await window.supabaseClient.from("categorias").select("*").eq("ativo",true).order("id");if(error){console.error(error);return []}return data||[]}
async function carregarConfiguracaoLojaSupabase(){const {data,error}=await window.supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1);if(error){console.error(error);return null}return (data||[])[0]||null}
