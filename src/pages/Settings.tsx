
import { WebhookSettings } from '@/components/WebhookSettings';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Settings</h1>
          <p className="text-gray-400">Configure your account preferences</p>
        </div>
        
        <WebhookSettings />
      </div>
    </div>
  );
};

export default Settings;
