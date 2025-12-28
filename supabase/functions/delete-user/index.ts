// FIX: Using a more specific esm.sh URL with a build version to prevent potential type resolution issues.
// This ensures that the Deno global object and its methods like `serve` and `env` are correctly typed.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/deno/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição pre-flight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica se as variáveis de ambiente essenciais estão configuradas
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
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