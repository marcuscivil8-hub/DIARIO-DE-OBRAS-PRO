import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

// FIX: Declare Deno to provide type information to the TypeScript compiler
// for the Deno runtime environment used by Supabase Edge Functions.
declare const Deno: any;

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, role, username, obraIds } = await req.json();

    if (!email || !password || !name || !role || !username) {
        return new Response(JSON.stringify({ error: 'Faltam campos obrigatórios: email, password, name, role, username.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 1. Create the user in the auth schema
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, obra_ids: obraIds || [] },
      email_confirm: true, // Auto-confirm user for simplicity
    });

    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return new Response(JSON.stringify({ error: `Erro de autenticação: ${authError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const userId = authData.user.id;

    // 2. Create the user profile in the public.users table
    // The handle_new_user trigger should do this automatically, but doing it manually
    // here ensures all data is present immediately.
    const { error: profileError } = await supabaseAdmin.from('users').update({
        name,
        username,
        role,
        obra_ids: obraIds || null,
        email
    }).eq('id', userId);
    
    if (profileError) {
        // If the profile creation fails, we should ideally delete the auth user to avoid orphans.
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.error('Supabase profile error:', profileError.message);
        return new Response(JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    return new Response(JSON.stringify({ message: "Usuário criado com sucesso!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Internal function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});