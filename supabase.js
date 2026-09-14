// PASTELARIA EL SHADDAI — CONEXÃO CENTRAL COM SUPABASE
const SUPABASE_URL="https://qjwojyxfktabdkbiryfx.supabase.co";
const SUPABASE_KEY="sb_publishable_eJ_vgt25nzDANKPq1jFW0g_EGnji9oG";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

async function carregarProdutosSupabase(){
  const {data,error}=await supabaseClient.from("produtos").select("*").eq("ativo",true).order("id");
  if(error){console.error(error);return [];} return data||[];
}
async function carregarCategoriasSupabase(){
  const {data,error}=await supabaseClient.from("categorias").select("*").eq("ativo",true).order("id");
  if(error){console.error(error);return [];} return data||[];
}
async function carregarConfiguracaoLojaSupabase(){
  const {data,error}=await supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1);
  if(error){console.error(error);return null;} return (data||[])[0]||null;
}
