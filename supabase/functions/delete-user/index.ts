// FIX: Corrected the type definition URL for the Deno runtime by adding the version specifier. This resolves errors related to missing Deno properties like 'serve' and 'env'.
/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição pre-flight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extrai o ID do usuário do corpo da requisição
    const { user_id } = await req.json()
    if (!user_id) {
      throw new Error("O 'user_id' é obrigatório.")
    }

    // Cria um cliente admin do Supabase que tem permissões elevadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
