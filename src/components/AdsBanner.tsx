import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  image_url?: string;
}

export const AdsBanner = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAds();
    const dismissed = localStorage.getItem('dismissedAds');
    if (dismissed) {
      setDismissedAds(JSON.parse(dismissed));
    }
  }, []);

  const fetchActiveAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAd = (adId: string) => {
    const newDismissed = [...dismissedAds, adId];
    setDismissedAds(newDismissed);
    localStorage.setItem('dismissedAds', JSON.stringify(newDismissed));
  };

  const visibleAds = ads.filter(ad => !dismissedAds.includes(ad.id));

  if (loading || visibleAds.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        {visibleAds.map((ad) => (
          <Card key={ad.id} className="bg-gradient-to-r from-blue-400/80 to-blue-600/80 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {ad.image_url && (
                  <img 
                    src={ad.image_url} 
                    alt={ad.title}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2 text-center">{ad.title}</h3>
                  <p className="text-black-300">{ad.content}</p>
                </div>
                <button
                  onClick={() => dismissAd(ad.id)}
                  className="ml-4 text-black-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Dismiss ad"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};