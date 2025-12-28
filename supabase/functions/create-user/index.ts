// FIX: Corrected the type definition URL to use a specific version, which resolves issues with locating the type file and subsequent Deno runtime errors.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let newUser: any = null
  try {
    const { name, email, password, username, role, obraIds } = await req.json()

    if (!email || !password || !name || !role || !username) {
      throw new Error('Campos obrigatórios ausentes (email, password, name, role, username).')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Criar o usuário na autenticação, passando os dados do perfil nos metadados.
    // O gatilho 'handle_new_user' no banco de dados usará esses dados para criar o perfil.
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        name: name,
        username: username,
        role: role,
        obra_ids: obraIds,
      },
    })

    if (authError) {
      throw new Error(`Erro de autenticação: ${authError.message}`)
    }

    newUser = data.user

    // 2. A criação manual do perfil foi removida, pois o gatilho do DB agora cuida disso.

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso!', user: newUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    // Rollback: se ocorrer um erro, deleta o usuário da autenticação.
    // O perfil será removido em cascata pela chave estrangeira.
    if (newUser?.id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabaseAdmin.auth.admin.deleteUser(newUser.id)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})