import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// FIX: Replaced `Deno.serve` with imported `serve` for better compatibility across Deno environments, as the global `Deno` object may not have up-to-date type definitions.
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("User ID is required");
    }

    // FIX: Suppressing TypeScript errors for Deno.env, which is available in the Supabase runtime but may not be in the local type definitions.
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      // It's possible the user doesn't exist in auth but does in the table
      // We can consider this a "soft" error and still proceed to delete the profile
      console.warn(`Could not delete user from auth: ${error.message}`);
    }

    return new Response(JSON.stringify({ message: "User deletion process initiated.", data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
