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
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  let authUserId: string | null = null;

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('ERRO CRÍTICO: As variáveis de ambiente PROJECT_URL e/ou SERVICE_ROLE_KEY não estão configuradas para a Edge Function "create-user".');
      throw new Error('As variáveis de ambiente PROJECT_URL e SERVICE_ROLE_KEY não estão configuradas na Edge Function.');
    }
    
    const { name, email, password, username, role, obraIds } = await req.json()

    if (!email || !password || !name || !role || !username) {
      throw new Error('Campos obrigatórios ausentes (email, password, name, role, username).')
    }

    // Passo 1: Criar o usuário no sistema de autenticação.
    // A propriedade user_metadata foi removida pois o perfil será criado manualmente.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('User already exists')) {
        throw new Error('Este email já está cadastrado.');
      }
      throw new Error(`Erro na autenticação: ${authError.message}`)
    }
    
    const authUser = authData.user;
    if (!authUser) {
        throw new Error("Falha ao criar o registro de autenticação do usuário.");
    }
    // Armazena o ID para possível rollback.
    authUserId = authUser.id;

    // Passo 2: Criar o registro correspondente na tabela 'profiles'.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: authUser.id,
            name: name,
            email: email,
            username: username,
            role: role,
            obra_ids: role === 'Cliente' ? obraIds : null
        });
    
    // Se a criação do perfil falhar, o authError do passo anterior não será acionado.
    // Precisamos de uma verificação separada aqui.
    if (profileError) {
        // Lança o erro para ser pego pelo bloco catch, que cuidará do rollback.
        throw new Error(`Erro no perfil: ${profileError.message}`);
    }


    return new Response(JSON.stringify({ message: 'Usuário e perfil criados com sucesso!', user: authUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })

  } catch (error) {
    // Bloco de Rollback: Se um usuário de autenticação foi criado (authUserId não é nulo)
    // mas ocorreu um erro subsequente (ex: falha ao criar o perfil),
    // o usuário de autenticação é excluído para evitar inconsistência de dados.
    if (authUserId) {
      console.log(`Iniciando rollback: Deletando usuário de autenticação com ID ${authUserId} devido ao erro: ${error.message}`);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }
    
    console.error('Erro final no processo de criação:', error.message);
    // Garante que a resposta seja sempre um JSON com uma chave 'error'
    return new Response(JSON.stringify({ error: error.message || 'Ocorreu um erro desconhecido.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})