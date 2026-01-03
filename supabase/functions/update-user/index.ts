// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
//
// Start typing below!

import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

declare var Deno: any;

console.log('Update user function booting up!');

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, password } = await req.json()

    if (!userId) {
      throw new Error('O ID do usuário é obrigatório.')
    }
    
    if (!password) {
        throw new Error('A nova senha é obrigatória.')
    }
    
    if (password.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
    )

    if (error) {
      console.error(`Error updating password for user ${userId}:`, error.message);
      throw error
    }

    return new Response(JSON.stringify({ message: 'Senha do usuário atualizada com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('An unexpected error occurred in update-user:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
