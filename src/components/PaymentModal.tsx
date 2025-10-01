import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Bitcoin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentModalProps {
  script: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal = ({ script, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCryptoPayment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to purchase scripts"
      });
      return;
    }

    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-crypto-payment', {
        body: {
          script_id: script.id,
          amount: script.price,
          currency: 'BNB'
        }
      });

      if (error) throw error;

      setPaymentStatus('pending');
      
      toast({
        title: "Payment Created",
        description: "Follow the payment instructions below to complete your purchase."
      });
      

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to create payment"
      });
      setPaymentStatus('failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('payments')
        .select('status')
        .eq('user_id', user.id)
        .eq('script_id', script.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (data) {
        setPaymentStatus('completed');
        onPaymentSuccess();
        toast({
          title: "Payment Confirmed!",
          description: "You can now download this script"
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-blue-800/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            Purchase Script
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Complete your payment to download this premium script
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-black border-blue-800/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {script.image_url && (
                <img
                  src={script.image_url}
                  alt={script.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <CardTitle className="text-lg text-white">{script.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  Premium FiveM Script
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Price:</span>
              <div className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4 text-orange-500" />
                <span className="text-xl font-bold text-white">{script.price} BNB</span>
              </div>
            </div>

            {paymentStatus === 'idle' && (
              <Button
                onClick={handleCryptoPayment}
                disabled={paymentLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900"
              >
                {paymentLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Payment...
                  </div>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Pay with Crypto
                  </>
                )}
              </Button>
            )}

            {paymentStatus === 'pending' && (
              <div className="space-y-3">
                <Badge variant="secondary" className="w-full justify-center py-2 bg-yellow-900/50 text-yellow-400 border-yellow-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Payment Processing
                </Badge>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-white">Send Payment To:</h4>
                  <div className="space-y-2">
                    <div className="bg-black border border-gray-600 rounded p-3">
                      <p className="text-xs text-gray-400 mb-1">Wallet Address:</p>
                      <p className="text-sm text-white font-mono break-all select-all">0xebb11a6839fb387a3dae9cadf463571901da0744</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white ml-1 font-semibold">{script.price} BNB</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Network:</span>
                        <span className="text-white ml-1">BNB Smart Chain (BEP20)</span>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-yellow-400 text-xs">⏳ Payment will be confirmed automatically</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center">After sending, click below to verify.</p>
                <Button
                  onClick={checkPaymentStatus}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/50"
                >
                  Check Payment Status
                </Button>
              </div>
            )}

            {paymentStatus === 'completed' && (
              <Badge variant="default" className="w-full justify-center py-2 bg-green-900/50 text-green-400 border-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Payment Completed
              </Badge>
            )}

            {paymentStatus === 'failed' && (
              <Badge variant="destructive" className="w-full justify-center py-2">
                <AlertCircle className="h-4 w-4 mr-2" />
                Payment Failed
              </Badge>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500 text-center">
          Secure crypto payments powered by Binance
        </div>
      </DialogContent>
    </Dialog>
  );
};