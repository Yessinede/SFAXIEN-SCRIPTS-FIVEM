
interface DiscordWebhookPayload {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
  }>;
}

export const sendDiscordNotification = async (
  webhookUrl: string,
  userName: string,
  scriptName: string,
  scriptCategory: string
) => {
  try {
    const payload: DiscordWebhookPayload = {
      embeds: [
        {
          title: "🎉 New Resource Download!",
          description: `A resource has been downloaded from your FiveM store`,
          color: 0x00ff00,
          fields: [
            {
              name: "👤 Downloaded by",
              value: userName,
              inline: true
            },
            {
              name: "📦 Resource",
              value: scriptName,
              inline: true
            },
            {
              name: "🏷️ Category",
              value: scriptCategory,
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    console.log('Discord notification sent successfully');
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
};
