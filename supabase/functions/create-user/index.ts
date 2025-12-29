
// FIX: Removed reference directives that were causing lib definition errors and added a Deno declaration.
declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('PROJECT_URL');
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
  
  let authUser: any = null;
  // FIX: Declared supabaseAdmin here to widen its scope to the catch block for rollback operations.
  let supabaseAdmin: any;

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('ERRO CRÍTICO: As variáveis de ambiente PROJECT_URL e/ou SERVICE_ROLE_KEY não estão configuradas para a Edge Function "create-user".');
      throw new Error('As variáveis de ambiente PROJECT_URL e SERVICE_ROLE_KEY não estão configuradas na Edge Function.');
    }
    
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: authUser.id,
            email: email,
            name: name,
            username: username,
            role: role,
            obra_ids: obraIds || [], // Garante que seja sempre um array
        })
        .select();

    if (profileError) {
        // Log do erro detalhado para depuração nos logs da Supabase Function
        console.error('Erro detalhado do Supabase Profile Insert:', profileError);

        // Verifica erros específicos para dar um feedback melhor ao cliente
        if (profileError.code === '23505' && profileError.message.includes('username')) {
             throw new Error('Este nome de usuário já está em uso.');
        }

        // Erro genérico, mas mais informativo, do perfil
        throw new Error(`Erro ao criar o perfil do usuário: ${profileError.message}`);
    }

    if (!profileData || profileData.length !== 1) {
        console.error('Insert into profiles did not return a single row.', { profileData });
        throw new Error("Falha crítica ao criar o perfil do usuário: a inserção não retornou o registro esperado.");
    }


    return new Response(JSON.stringify({ message: 'Usuário e perfil criados com sucesso!', user: authUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })

  } catch (error) {
    // Rollback: se ocorrer qualquer erro após a criação do usuário na autenticação,
    // deleta o registro da autenticação para manter a consistência.
    // FIX: Check if authUser and supabaseAdmin were successfully created before attempting rollback.
    if (authUser?.id && supabaseAdmin) {
      console.log(`Iniciando rollback para o usuário de auth: ${authUser.id}`);
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    }

    console.error('Erro final no processo de criação:', error.message);
    // Garante que a resposta seja sempre um JSON com uma chave 'error'
    return new Response(JSON.stringify({ error: error.message || 'Ocorreu um erro desconhecido.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 para erros do lado do cliente (ex: usuário duplicado)
    })
  }
})
