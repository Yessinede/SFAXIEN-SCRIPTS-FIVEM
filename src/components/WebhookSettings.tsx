
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const WebhookSettings = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWebhookSettings();
    }
  }, [user]);

  const loadWebhookSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('discord_webhook_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.discord_webhook_url) {
        setWebhookUrl(data.discord_webhook_url);
      }
    } catch (error: any) {
      console.error('Error loading webhook settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load webhook settings"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveWebhookSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ discord_webhook_url: webhookUrl || null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Discord webhook URL has been updated"
      });
    } catch (error: any) {
      console.error('Error saving webhook settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save webhook settings"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a webhook URL first"
      });
      return;
    }

    setIsLoading(true);
    try {
      const testPayload = {
        embeds: [
          {
            title: "🧪 Test Notification",
            description: "This is a test message from your FiveM resource store",
            color: 0x0099ff,
            fields: [
              {
                name: "Status",
                value: "Webhook is working correctly!",
                inline: false
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
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`Webhook test failed: ${response.status}`);
      }

      toast({
        title: "Test Successful",
        description: "Check your Discord channel for the test message"
      });
    } catch (error: any) {
      console.error('Webhook test failed:', error);
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: "Failed to send test message. Please check your webhook URL."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discord Webhook Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Please log in to configure webhook settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord Webhook Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="webhook-url">Discord Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-gray-400 mt-1">
            Get notifications when someone downloads your resources
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={saveWebhookSettings}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          
          <Button 
            onClick={testWebhook}
            disabled={isLoading || !webhookUrl}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Webhook'}
          </Button>
        </div>

        <div className="text-sm text-gray-400 space-y-2">
          <p><strong>How to set up Discord webhook:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to your Discord server settings</li>
            <li>Navigate to Integrations → Webhooks</li>
            <li>Click "New Webhook"</li>
            <li>Choose the channel for notifications</li>
            <li>Copy the webhook URL and paste it above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
