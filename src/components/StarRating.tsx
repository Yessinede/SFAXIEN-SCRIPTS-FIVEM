
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface StarRatingProps {
  scriptId: string;
  currentRating?: number;
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onRatingUpdate?: () => void;
}

export const StarRating = ({ 
  scriptId, 
  currentRating = 0, 
  totalRatings = 0,
  size = 'md', 
  readonly = false,
  onRatingUpdate
}: StarRatingProps) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingsCount, setRatingsCount] = useState<number>(totalRatings);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  useEffect(() => {
    if (user) {
      fetchUserRating();
    }
    fetchRatingsCount();
  }, [user, scriptId]);

  const fetchRatingsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('script_id', scriptId);

      if (error) {
        console.error('Error fetching ratings count:', error);
        return;
      }

      setRatingsCount(count || 0);
    } catch (error) {
      console.error('Error fetching ratings count:', error);
    }
  };

  const fetchUserRating = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('script_id', scriptId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user rating:', error);
        return;
      }

      if (data) {
        setUserRating(data.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRatingClick = async (rating: number) => {
    if (readonly || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          script_id: scriptId,
          rating: rating
        });

      if (error) throw error;

      setUserRating(rating);
      if (onRatingUpdate) {
        onRatingUpdate();
      }
      
      toast({
        title: "Rating submitted",
        description: `You rated this script ${rating} star${rating !== 1 ? 's' : ''}`
      });
    } catch (error: any) {
      console.error('Rating error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit rating"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || userRating || 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
            disabled={readonly || !user || isSubmitting}
            className={`${readonly || !user ? 'cursor-default' : 'cursor-pointer hover:scale-110'} 
                       transition-transform duration-150 ${isSubmitting ? 'opacity-50' : ''}`}
          >
            <Star 
              className={`${sizeClasses[size]} ${
                star <= displayRating 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : star <= currentRating 
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-400 ml-1">
        ({currentRating.toFixed(1)})
        {ratingsCount > 0 && ` • ${ratingsCount} rating${ratingsCount !== 1 ? 's' : ''}`}
      </span>
      {!readonly && !user && (
        <span className="text-xs text-gray-500 ml-2">Login to rate</span>
      )}
    </div>
  );
};
