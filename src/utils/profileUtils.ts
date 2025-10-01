
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_profile', { user_id: userId }) as { data: Profile[] | null, error: any };
    
    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Profile fetch failed:', error);
    return null;
  }
};
