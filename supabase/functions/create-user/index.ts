// FIX: Corrected the type definition URL to use a specific version, which resolves issues with locating the type file and subsequent Deno runtime errors.
// FIX: Corrected the URL for the Supabase functions type definitions to point to the correct path (`/deno/` instead of `/src/`), resolving errors with Deno runtime types.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/deno/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verificar variáveis de ambiente no início para falhar rápido e com clareza
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não estão configuradas na Edge Function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Erro interno do servidor
    })
  }
  
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  let newUser: any = null;

  try {
    const { name, email, password, username, role, obraIds } = await req.json()

    if (!email || !password || !name || !role || !username) {
      throw new Error('Campos obrigatórios ausentes (email, password, name, role, username).')
    }

    // 1. Criar o usuário na autenticação, passando os dados do perfil nos metadados.
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
       // Melhora a mensagem de erro para o usuário
      if (authError.message.includes('User already exists')) {
        throw new Error('Este email já está cadastrado.');
      }
      throw new Error(`Erro de autenticação: ${authError.message}`)
    }

    newUser = data.user

    // 2. O gatilho do banco de dados irá criar o perfil correspondente automaticamente.

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso!', user: newUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    // Rollback: se ocorrer um erro após a criação do usuário, deleta o registro da autenticação.
    if (newUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.id)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})