
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, Download, Users } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const HeroSection = ({ searchQuery, setSearchQuery }: HeroSectionProps) => {
  return (
    <section className="relative bg-gradient-to-br from-black via-blue-950 to-black py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
            SFAXIEN SCRIPTS
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Premium FiveM Resources for QBCore • Custom Scripts • MLOs • Vehicles & More
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search scripts, MLOs, vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-4 text-lg bg-black/50 border-blue-800/50 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900">
                Search
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Download className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-3xl font-bold text-white">500+</span>
              </div>
              <p className="text-gray-400">Downloads</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-3xl font-bold text-white">50+</span>
              </div>
              <p className="text-gray-400">Premium Scripts</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-3xl font-bold text-white">100+</span>
              </div>
              <p className="text-gray-400">Happy Customers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
