import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  script_id: string;
  user_id: string;
}

interface DiscordWebhookPayload {
  embeds: Array<{
    title: string;
    description: string;
    color: number;
    fields: Array<{
      name: string;
      value: string;
      inline: boolean;
    }>;
    timestamp: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { script_id, user_id }: NotificationRequest = await req.json();

    const { data: script, error: scriptError } = await supabaseClient
      .from('scripts')
      .select(`
        name,
        categories (name)
      `)
      .eq('id', script_id)
      .single();

    if (scriptError || !script) {
      console.error('Error fetching script:', scriptError);
      return new Response(JSON.stringify({ error: 'Script not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: scriptOwner, error: ownerError } = await supabaseClient
      .from('scripts')
      .select(`
        id,
        profiles!scripts_created_by_fkey (discord_webhook_url)
      `)
      .eq('id', script_id)
      .single();

    if (ownerError) {
      console.error('Error fetching script owner:', ownerError);
      return new Response(JSON.stringify({ success: true, message: 'No webhook configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookUrl = scriptOwner?.profiles?.discord_webhook_url;
    if (!webhookUrl) {
      console.log('No Discord webhook URL configured for script owner');
      return new Response(JSON.stringify({ success: true, message: 'No webhook configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: DiscordWebhookPayload = {
      embeds: [
        {
          title: "🎉 New Resource Download!",
          description: `A resource has been downloaded from your FiveM store`,
          color: 0x00ff00, // Green color
          fields: [
            {
              name: "👤 Downloaded by",
              value: profile.username || 'Unknown User',
              inline: true
            },
            {
              name: "📦 Resource",
              value: script.name,
              inline: true
            },
            {
              name: "🏷️ Category",
              value: script.categories?.name || 'Uncategorized',
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!discordResponse.ok) {
      console.error('Discord webhook failed:', discordResponse.status, await discordResponse.text());
    } else {
      console.log('Discord notification sent successfully');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-discord-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);