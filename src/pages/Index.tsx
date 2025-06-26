
import { useAuth } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeaturedResources } from '@/components/FeaturedResources';
import { ResourceGrid } from '@/components/ResourceGrid';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Footer } from '@/components/Footer';
import { useState } from 'react';

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      {!isAdmin ? (
        <>
          <HeroSection 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
          />
          <FeaturedResources />
          <ResourceGrid 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </>
      ) : (
        <AdminDashboard />
      )}
      <Footer />
    </div>
  );
};

export default Index;
