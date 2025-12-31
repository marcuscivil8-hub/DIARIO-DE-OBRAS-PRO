import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

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
      user_metadata: { name, role, username, obra_ids: obraIds || [] },
      email_confirm: true, // Auto-confirm user for simplicity
    });

    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return new Response(JSON.stringify({ error: `Erro de autenticação: ${authError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // The handle_new_user trigger in schema.sql will automatically create the profile
    // in the public.users table, so no manual insertion is needed here.

    return new Response(JSON.stringify({ user: authData.user }), {
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
