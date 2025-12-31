// This file contains the shared CORS headers for all Edge Functions.
// It allows requests from any origin and specifies the headers that are allowed.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
