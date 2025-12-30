// FIX: Updated Supabase functions type reference to a more reliable CDN to prevent type resolution errors.
// FIX: Replaced flaky jsdelivr.net URL with a more reliable CDN from unpkg.com to resolve type definition file errors.
// FIX: Replaced unpkg.com CDN with esm.sh to resolve type definition file errors.
// FIX: Pinned Supabase functions types to a specific version for more reliable type resolution.
/// <reference types="https://esm.sh/@supabase/functions-js@2" />
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})