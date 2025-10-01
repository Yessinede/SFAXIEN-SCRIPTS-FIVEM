import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Eye, Bitcoin, Lock, Heart } from 'lucide-react';
import { StarRating } from './StarRating';
import { PaymentModal } from './PaymentModal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendDiscordNotification } from '@/utils/discordWebhook';

interface ScriptCardProps {
  script: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    file_url: string;
    downloads: number;
    rating: number | null;
    categories?: { name: string };
  };
  onRatingUpdate?: () => void;
}

export const ScriptCard = ({ script, onRatingUpdate }: ScriptCardProps) => {
  const [isPurchased, setIsPurchased] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && script.price > 0) {
      checkPurchaseStatus();
    }
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, script.id, script.price]);

  const checkPurchaseStatus = async () => {
    if (!user) return;

    setCheckingPayment(true);
    try {
      const { data } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('script_id', script.id)
        .eq('status', 'completed')
        .maybeSingle();

      setIsPurchased(!!data);
    } catch (error) {
      console.error('Error checking purchase status:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('script_id', script.id)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to manage favorites"
      });
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('script_id', script.id);

        setIsFavorite(false);
        toast({
          title: "Removed from Favorites",
          description: "Script removed from your favorites"
        });
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            script_id: script.id
          });

        setIsFavorite(true);
        toast({
          title: "Added to Favorites",
          description: "Script added to your favorites"
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorites"
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to download scripts"
      });
      return;
    }

    if (script.price > 0 && !isPurchased) {
      setPaymentModalOpen(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { script_id: script.id }
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'Unable to get download URL');
      }

      if (user) {
        await supabase
          .from('downloads')
          .insert({
            user_id: user.id,
            script_id: script.id
          });
      }

      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename || `${script.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your script download has begun"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Download Error",
        description: error instanceof Error ? error.message : 'Failed to download script'
      });
    }
  };

  const handlePaymentSuccess = () => {
    setIsPurchased(true);
    setPaymentModalOpen(false);
    handleDownload();
  };

  const isFreescript = script.price === 0;
  const canDownload = isFreescript || isPurchased;

  return (
    <>
      <Card className="group bg-gray-900/50 border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
        <CardHeader className="pb-3">
          <div className="relative">
            {script.image_url && (
              <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-800">
                <img
                  src={script.image_url}
                  alt={script.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                  {script.name}
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1 line-clamp-2">
                  {script.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {script.categories && (
            <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-600">
              {script.categories.name}
            </Badge>
          )}

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{script.downloads}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{script.rating ? script.rating.toFixed(1) : '0.0'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isFreescript ? (
                <Badge variant="default" className="bg-green-900/50 text-green-400 border-green-600">
                  FREE
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-900/50 text-orange-400 border-orange-600 flex items-center gap-1">
                  <Bitcoin className="h-3 w-3" />
                  {script.price} BNB
                </Badge>
              )}
            </div>
          </div>

          <StarRating scriptId={script.id} onRatingUpdate={onRatingUpdate} />

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={checkingPayment}
              className={`flex-1 ${
                canDownload
                  ? 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                  : 'bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900'
              }`}
            >
              {checkingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Checking...
                </div>
              ) : canDownload ? (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Purchase & Download
                </>
              )}
            </Button>
            
            <Button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              variant="outline"
              size="icon"
              className={`${
                isFavorite 
                  ? 'bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30' 
                  : 'border-gray-600 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {favoriteLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        script={script}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};