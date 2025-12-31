// FIX: Updated the Supabase functions type reference to a valid URL to resolve the type definition error.
/// <reference types="https://esm.sh/@supabase/functions-js/v2" />
// FIX: Added Deno global type declaration to resolve TypeScript errors in non-Deno environments.
declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('PROJECT_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('As variáveis de ambiente PROJECT_URL e SERVICE_ROLE_KEY não estão configuradas na Edge Function.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { name, email, password, username, role, obraIds } = await req.json()

    if (!email || !password || !name || !role || !username) {
      throw new Error('Campos obrigatórios ausentes (email, password, name, role, username).')
    }

    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        name,
        username,
        role,
        obra_ids: role === 'Cliente' ? (obraIds || []) : []
      }
    })

    if (error) {
      if(error.message.includes('User already exists')) {
        throw new Error('Este email já está cadastrado.');
      }
      throw error
    }

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso!', user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    console.error('Erro na Edge Function (create-user):', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado na função.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retorna 200 mesmo em caso de erro para enviar o corpo do erro.
    });
  }
})