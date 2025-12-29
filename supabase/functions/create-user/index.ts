// Fix: Use a URL-based type reference for Deno to resolve type definition errors.
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables.');
    return new Response(JSON.stringify({ error: 'Erro de configuração do servidor.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
  
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  let authUser: any = null;

  try {
    const { name, email, password, username, role, obraIds } = await req.json()

    if (!email || !password || !name || !role || !username) {
      throw new Error('Campos obrigatórios ausentes (email, password, name, role, username).')
    }

    // 1. Criar o usuário na autenticação.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirma o email
    })

    if (authError) {
      if (authError.message.includes('User already exists')) {
        throw new Error('Este email já está cadastrado.');
      }
      throw new Error(`Erro na autenticação: ${authError.message}`)
    }
    
    authUser = authData.user;
    if (!authUser) {
        throw new Error("Falha ao criar o registro de autenticação do usuário.");
    }
    
    // 2. Inserir o perfil explicitamente na tabela 'profiles'.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: authUser.id,
            name: name,
            username: username,
            role: role,
            obra_ids: obraIds,
        });

    if (profileError) {
        // Se a inserção do perfil falhar, joga um erro para acionar o rollback.
        throw new Error(`Erro ao criar o perfil do usuário: ${profileError.message}`);
    }


    return new Response(JSON.stringify({ message: 'Usuário e perfil criados com sucesso!', user: authUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })

  } catch (error) {
    // Rollback: se ocorrer qualquer erro após a criação do usuário na autenticação,
    // deleta o registro da autenticação para manter a consistência.
    if (authUser?.id) {
      console.log(`Iniciando rollback para o usuário de auth: ${authUser.id}`);
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    }

    console.error('Erro no processo de criação:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
