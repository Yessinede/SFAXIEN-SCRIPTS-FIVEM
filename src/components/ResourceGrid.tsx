
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Download, ExternalLink, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResourceGridProps {
  searchQuery: string;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

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

export const ResourceGrid = ({ searchQuery, selectedCategory, setSelectedCategory }: ResourceGridProps) => {
  const [sortBy, setSortBy] = useState('newest');
  const [resources, setResources] = useState<Resource[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  // Listen for navigation category filter events
  useEffect(() => {
    const handleCategoryFilter = (event: CustomEvent) => {
      const category = event.detail;
      setSelectedCategory(category);
    };

    window.addEventListener('filterCategory', handleCategoryFilter as EventListener);
    
    return () => {
      window.removeEventListener('filterCategory', handleCategoryFilter as EventListener);
    };
  }, [setSelectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .in('name', ['SCRIPTS', 'CLOTHES', 'YMAP']);
      
      if (error) throw error;
      setCategoriesData(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load resources"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = selectedCategory === 'all';
    if (!matchesCategory && resource.categories?.name) {
      matchesCategory = resource.categories.name === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

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
        fetchResources();
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
      <section id="resources" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Create categories list with "All" plus database categories
  const allCategories = [
    { id: 'all', name: 'All Resources' },
    ...categoriesData.map(cat => ({ id: cat.name, name: cat.name }))
  ];

  return (
    <section id="resources" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">All Resources</h2>
            <p className="text-gray-400">Browse our complete collection of FiveM resources</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 lg:mt-0">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-black border border-blue-800/50 text-white px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                {allCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black border border-blue-800/50 text-white px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-gray-400">
            Showing {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-black rounded-xl overflow-hidden border border-gray-800 hover:border-blue-600/50 transition-all duration-300 group hover:transform hover:scale-105">
              {/* Image */}
              <div className="relative overflow-hidden">
                <img 
                  src={resource.image_url || "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop"} 
                  alt={resource.name}
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-blue-600/90 text-white text-xs">
                    {resource.categories?.name || 'Uncategorized'}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {resource.name}
                </h3>
                <p className="text-gray-400 mb-3 text-sm leading-relaxed line-clamp-2">
                  {resource.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-3 text-sm">
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    <span>{resource.rating || 4.5}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Download className="w-3 h-3 mr-1" />
                    <span>{resource.downloads}</span>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                  <div>
                    {resource.price === 0 ? (
                      <span className="text-lg font-bold text-green-400">FREE</span>
                    ) : (
                      <span className="text-lg font-bold text-white">${resource.price}</span>
                    )}
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleResourceAction(resource)}
                    className={`${
                      resource.price === 0 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                    }`}
                  >
                    {resource.price === 0 ? (
                      <Download className="w-3 h-3" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredResources.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No resources found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </section>
  );
};
