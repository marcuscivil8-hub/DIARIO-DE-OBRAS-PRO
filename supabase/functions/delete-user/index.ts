
// FIX: Removed reference directives that were causing lib definition errors and added a Deno declaration.
declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// FIX: CORS headers are now defined directly inside the function
// to remove the dependency on the missing _shared/cors.ts file.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: any) => {
  // Trata a requisição pre-flight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica se as variáveis de ambiente essenciais estão configuradas
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('ERRO CRÍTICO: As variáveis de ambiente SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não estão configuradas para a Edge Function "delete-user".');
      throw new Error('As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não estão configuradas na Edge Function.');
    }

    // Extrai o ID do usuário do corpo da requisição
    const { user_id } = await req.json()
    if (!user_id) {
      throw new Error("O 'user_id' é obrigatório.")
    }

    // Cria um cliente admin do Supabase que tem permissões elevadas
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Usa o cliente admin para deletar o usuário do sistema de autenticação
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (error) {
      throw error
    }

    // Retorna uma resposta de sucesso
    return new Response(JSON.stringify({ message: `Usuário ${user_id} deletado com sucesso.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Retorna uma resposta de erro
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
