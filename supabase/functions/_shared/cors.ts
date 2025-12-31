// Arquivo centralizado para configurações de CORS (Cross-Origin Resource Sharing)
// Isso garante que todas as Edge Functions usem as mesmas permissões, facilitando a manutenção.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}