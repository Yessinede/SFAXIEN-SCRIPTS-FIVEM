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
    const { scriptName } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Notifying users about new release:', scriptName);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('discord_webhook_url')
      .not('discord_webhook_url', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with Discord webhooks`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users with Discord webhooks found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const message = `🎉 **DEAR CUSTOMER WE ARE HAPPY TO ANNOUNCE THAT THERE IS NEW RELEASE HAVE BEEN UPLOADED IN OUR STORE** 🎉\n\n📦 **New Release:** ${scriptName}\n\nVisit our store to check it out!`;

    const notifications = profiles.map(async (profile) => {
      try {
        const response = await fetch(profile.discord_webhook_url!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: message,
            username: 'Store Bot',
            avatar_url: 'https://cdn.discordapp.com/emojis/123456789.png'
          }),
        });

        if (!response.ok) {
          console.error(`Discord webhook failed for URL ${profile.discord_webhook_url}:`, response.status);
          return { success: false, webhook: profile.discord_webhook_url };
        }

        return { success: true, webhook: profile.discord_webhook_url };
      } catch (error) {
        console.error(`Error sending Discord notification to ${profile.discord_webhook_url}:`, error);
        return { success: false, webhook: profile.discord_webhook_url, error: error.message };
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Discord notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Discord notifications sent to ${successful} users (${failed} failed)`,
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in notify-new-release function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});