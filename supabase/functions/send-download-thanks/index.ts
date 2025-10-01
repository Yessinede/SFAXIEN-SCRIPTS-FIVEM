import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThankYouRequest {
  user_id: string;
  script_name: string;
  script_image_url: string;
  auth_provider: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { user_id, script_name, script_image_url, auth_provider }: ThankYouRequest = await req.json();

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check authentication provider
    const isDiscordAuth = user.app_metadata?.provider === 'discord' || auth_provider === 'discord';
    const isEmailAuth = user.app_metadata?.provider === 'email' || auth_provider === 'email';

    if (isDiscordAuth) {
      // Send Discord DM
      await sendDiscordDM(user, script_name, script_image_url);
    } else if (isEmailAuth && user.email) {
      // Send Email
      await sendThankYouEmail(user.email, script_name, script_image_url);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('send-download-thanks error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendDiscordDM(user: any, scriptName: string, imageUrl: string) {
  const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
  const discordUserId = user.user_metadata?.provider_id || user.identities?.[0]?.id;

  if (!discordUserId) {
    console.error('No Discord user ID found');
    return;
  }

  try {
    // Create DM channel
    const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: discordUserId,
      }),
    });

    if (!dmChannelResponse.ok) {
      console.error('Failed to create DM channel:', await dmChannelResponse.text());
      return;
    }

    const dmChannel = await dmChannelResponse.json();

    // Send message with embed
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [{
          title: '🎉 Thank You for Your Download!',
          description: `Thank you for downloading **${scriptName}**!\n\nWe hope you enjoy using this script. If you have any questions or need support, feel free to reach out to us.`,
          color: 0x3b82f6,
          image: {
            url: imageUrl,
          },
          footer: {
            text: 'Best regards from SFAXIEN SCRIPTS Team',
          },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!messageResponse.ok) {
      console.error('Failed to send Discord message:', await messageResponse.text());
    } else {
      console.log('Discord DM sent successfully');
    }
  } catch (error) {
    console.error('Error sending Discord DM:', error);
  }
}

async function sendThankYouEmail(email: string, scriptName: string, imageUrl: string) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SFAXIEN SCRIPTS <onboarding@resend.dev>',
        to: [email],
        subject: `Thank You for Downloading ${scriptName}!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                  background-color: #f3f4f6;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                  padding: 40px 20px;
                  text-align: center;
                  color: white;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: bold;
                }
                .content {
                  padding: 40px 30px;
                }
                .content h2 {
                  color: #1f2937;
                  font-size: 24px;
                  margin-top: 0;
                  margin-bottom: 20px;
                }
                .content p {
                  color: #4b5563;
                  line-height: 1.6;
                  font-size: 16px;
                  margin-bottom: 20px;
                }
                .script-preview {
                  text-align: center;
                  margin: 30px 0;
                }
                .script-preview img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                .footer {
                  background-color: #f9fafb;
                  padding: 30px;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
                .footer strong {
                  color: #3b82f6;
                  display: block;
                  margin-top: 10px;
                  font-size: 16px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Thank You!</h1>
                </div>
                <div class="content">
                  <h2>Thank you for downloading ${scriptName}!</h2>
                  <p>We're excited to have you using our script. We hope it meets all your expectations and helps you achieve your goals.</p>
                  <div class="script-preview">
                    <img src="${imageUrl}" alt="${scriptName} Preview">
                  </div>
                  <p>If you have any questions, need support, or want to share feedback, please don't hesitate to reach out to us.</p>
                </div>
                <div class="footer">
                  <p>We appreciate your trust in our products!</p>
                  <strong>Best regards from SFAXIEN SCRIPTS Team</strong>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Failed to send email:', await emailResponse.text());
    } else {
      console.log('Thank you email sent successfully');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}