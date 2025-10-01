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
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { script_id } = await req.json();
    if (!script_id) {
      return new Response(JSON.stringify({ error: 'Missing script_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('id, name, price, file_url, downloads, image_url')
      .eq('id', script_id)
      .single();

    if (scriptError || !script) {
      return new Response(JSON.stringify({ error: 'Script not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (script.price > 0) {
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('script_id', script_id)
        .eq('status', 'completed')
        .maybeSingle();

      if (!payment) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const match = script.file_url.match(/\/storage\/v1\/object\/public\/(.+?)\/(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Invalid file URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bucket = match[1];
    const objectPath = match[2];

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60 * 5);

    if (signedError || !signed) {
      return new Response(JSON.stringify({ error: 'Failed to create download URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    supabase
      .from('scripts')
      .update({ downloads: (script.downloads || 0) + 1 })
      .eq('id', script.id)
      .then(() => console.log('Download count incremented'))
      .catch((e) => console.error('Failed to increment download count', e));

    const authProvider = user.app_metadata?.provider || 'email';
    supabase.functions
      .invoke('send-download-thanks', {
        body: {
          user_id: user.id,
          script_name: script.name,
          script_image_url: script.image_url,
          auth_provider: authProvider,
        },
      })
      .then(() => console.log('Thank you message sent'))
      .catch((e) => console.error('Failed to send thank you message', e));

    return new Response(JSON.stringify({ 
      url: signed.signedUrl,
      filename: `${script.name}.zip`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('get-download-url error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});