
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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

  const handleResourceAction = async (resource: Resource) => {
    if (resource.price === 0) {
      // Free resource - trigger download
      try {
        // Update download count
        await supabase
          .from('scripts')
          .update({ downloads: resource.downloads + 1 })
          .eq('id', resource.id);

        // Download the file directly from Supabase storage
        const response = await fetch(resource.file_url);
        if (!response.ok) {
          throw new Error('Failed to download file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${resource.name}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: `${resource.name} is being downloaded`
        });

        // Refresh the resources to show updated download count
        fetchFeaturedResources();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Download Error",
          description: "Failed to download the resource"
        });
      }
    } else {
      // Paid resource - redirect to Discord
      window.open('https://discord.com/channels/1322524733400678484/1340956407393943594', '_blank');
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
              <div key={resource.id} className="bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden border border-blue-900/30 hover:border-blue-600/50 transition-all duration-300 group hover:transform hover:scale-105">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img 
                    src={resource.image_url || "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop"} 
                    alt={resource.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-blue-600/90 text-white">
                      {resource.categories?.name || 'Uncategorized'}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      New
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {resource.name}
                  </h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                    {resource.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <span>{resource.rating || 4.5}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Download className="w-4 h-4 mr-1" />
                      <span>{resource.downloads}</span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      {resource.price === 0 ? (
                        <span className="text-2xl font-bold text-green-400">FREE</span>
                      ) : (
                        <span className="text-2xl font-bold text-white">${resource.price}</span>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleResourceAction(resource)}
                      className={`${
                        resource.price === 0 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                      }`}
                    >
                      {resource.price === 0 ? (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
