// ==========================================
// PASTELARIA EL SHADDAI
// CONEXÃO COM SUPABASE
// ==========================================

const SUPABASE_URL =
    "https://qjwojyxfktabdkbiryfx.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_eJ_vgt25nzDANKPq1jFW0g_EGnji9oG";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

async function carregarProdutosSupabase() {
    try {
        const resultado =
            await supabaseClient
                .from("produtos")
                .select("*")
                .eq("ativo", true)
                .order("id");

        if (resultado.error) {
            console.error(
                "Erro ao carregar produtos:",
                resultado.error
            );
            return [];
        }

        return resultado.data;
    }
    catch (erro) {
        console.error(
            "Erro na conexão com Supabase:",
            erro
        );
        return [];
    }
}

async function carregarCategoriasSupabase() {
    try {
        const resultado =
            await supabaseClient
                .from("categorias")
                .select("*")
                .eq("ativo", true)
                .order("id");

        if (resultado.error) {
            console.error(
                "Erro ao carregar categorias:",
                resultado.error
            );
            return [];
        }

        return resultado.data;
    }
    catch (erro) {
        console.error(
            "Erro na conexão com Supabase:",
            erro
        );
        return [];
    }
}
