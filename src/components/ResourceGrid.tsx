import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScriptCard } from './ScriptCard';

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

  const handleRatingUpdate = () => {
    fetchResources();
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

        <div className="mb-8">
          <p className="text-gray-400">
            Showing {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
            <ScriptCard key={resource.id} script={resource} onRatingUpdate={handleRatingUpdate} />
          ))}
        </div>

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
