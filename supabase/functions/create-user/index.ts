// FIX: Add a minimal Deno type definition to make Deno.env available to TypeScript.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Definindo corsHeaders internamente para evitar erro de módulo ausente
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Lida com a requisição de pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configurações de ambiente (URL/KEY) não encontradas.');
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
      email_confirm: true,
      user_metadata: {
        name,
        username,
        role,
        obra_ids: Array.isArray(obraIds) ? obraIds : []
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

  } catch (error: any) {
    console.error('Erro na Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
