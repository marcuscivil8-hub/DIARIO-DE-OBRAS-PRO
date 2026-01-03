// FIX: Add an ambient declaration for the Deno global object to resolve TypeScript errors.
declare var Deno: any;

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
//
// Start typing below!

import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Delete user function booting up!');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      throw new Error('O ID do usuário é obrigatório.')
    }

    // Create a Supabase client with the admin role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Delete the user from auth.users
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error(`Error deleting user ${userId}:`, error.message);
      throw error
    }
    
    // The user's profile in the public.users table should be deleted automatically
    // by the `ON DELETE CASCADE` constraint on the foreign key.

    return new Response(JSON.stringify({ message: 'Usuário excluído com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})