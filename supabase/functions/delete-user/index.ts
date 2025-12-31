// FIX: Add a minimal Deno type definition to make Deno.env available to TypeScript.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Lida com a requisição de pre-flight do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Busca as variáveis de ambiente (Tenta o padrão Supabase e o seu personalizado)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('As variáveis de ambiente PROJECT_URL e SERVICE_ROLE_KEY não estão configuradas.');
    }
    
    const { user_id } = await req.json()
    if (!user_id) {
        throw new Error("O 'user_id' é obrigatório para exclusão.")
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Deleta o usuário no Auth. O seu SQL com "ON DELETE CASCADE" 
    // cuidará de remover o registro na tabela public.profiles automaticamente.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: `Usuário ${user_id} deletado com sucesso.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Erro na Edge Function (delete-user):', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
