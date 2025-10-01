import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Starting cleanup of expired ads...');

    const { data: expiredAds, error: selectError } = await supabase
      .from('ads')
      .select('*')
      .lt('expires_at', new Date().toISOString());

    if (selectError) {
      console.error('Error selecting expired ads:', selectError);
      throw selectError;
    }

    console.log(`Found ${expiredAds?.length || 0} expired ads`);

    if (expiredAds && expiredAds.length > 0) {
      const { error: deleteError } = await supabase
        .from('ads')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (deleteError) {
        console.error('Error deleting expired ads:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully removed ${expiredAds.length} expired ads`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Removed ${expiredAds?.length || 0} expired ads` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in cleanup-expired-ads function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});