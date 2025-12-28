// FIX: Corrected the type definition URL to use a specific version, which resolves issues with locating the type file and subsequent Deno runtime errors.
// FIX: Corrected the URL for the Supabase functions type definitions to point to the correct path (`/deno/` instead of `/src/`), resolving errors with Deno runtime types.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/deno/edge-runtime.d.ts" />

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