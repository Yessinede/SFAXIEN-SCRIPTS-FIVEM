import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScriptCard } from '@/components/ScriptCard';

interface Resource {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  rating: number | null;
  downloads: number;
  file_url: string;
  categories?: { name: string };
}

export const FeaturedResources = () => {
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedResources();
  }, []);

  const fetchFeaturedResources = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setFeaturedResources(data || []);
    } catch (error: any) {
      console.error('Error fetching featured resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Featured Resources</h2>
            <p className="text-xl text-gray-400">Our most recent FiveM resources</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gradient-to-b from-gray-900 to-black rounded-xl h-64 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Featured Resources</h2>
          <p className="text-xl text-gray-400">Our most recent FiveM resources</p>
        </div>

        {featuredResources.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">No resources yet</h3>
            <p className="text-gray-400">Upload some scripts to see them featured here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredResources.map((resource) => (
              <ScriptCard key={resource.id} script={resource} onRatingUpdate={() => fetchFeaturedResources()} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};