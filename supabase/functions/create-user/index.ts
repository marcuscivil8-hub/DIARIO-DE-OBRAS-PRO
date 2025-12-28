// FIX: Corrected the type definition URL for the Deno runtime by adding the version specifier. This resolves errors related to missing Deno properties like 'serve' and 'env'.
/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Profile {
  name: string
  email: string
  username: string
  role: 'Admin' | 'Encarregado' | 'Cliente'
  obra_ids?: string[]
}

async function createProfile(supabase: SupabaseClient, userId: string, profileData: Profile) {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    name: profileData.name,
    email: profileData.email,
    username: profileData.username,
    role: profileData.role,
    obra_ids: profileData.obra_ids,
  })

  if (error) {
    throw new Error(`Erro ao criar perfil: ${error.message}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let newUser: any = null
  try {
    const { name, email, password, username, role, obraIds } = await req.json()

    if (!email || !password || !name || !role || !username) {
      throw new Error('Campos obrigatórios ausentes (email, password, name, role, username).')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Criar o usuário no sistema de autenticação
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirma o email
    })

    if (authError) {
      throw new Error(`Erro de autenticação: ${authError.message}`)
    }

    newUser = data.user

    // 2. Criar o perfil na tabela 'profiles'
    await createProfile(supabaseAdmin, newUser.id, {
      name,
      email,
      username,
      role,
      obra_ids: obraIds,
    })

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso!', user: newUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    // Rollback: se a criação do perfil falhar, deleta o usuário da autenticação
    if (newUser?.id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabaseAdmin.auth.admin.deleteUser(newUser.id)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
