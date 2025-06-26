
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, ShoppingCart, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (category: string) => {
    if (category === 'home') {
      window.location.href = '/';
    } else {
      // Scroll to the ResourceGrid section and filter by category
      const resourceSection = document.querySelector('#resources');
      if (resourceSection) {
        resourceSection.scrollIntoView({ behavior: 'smooth' });
        // Trigger category filter - we'll need to implement this communication
        const event = new CustomEvent('filterCategory', { detail: category });
        window.dispatchEvent(event);
      }
    }
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  return (
    <header className="bg-black/90 backdrop-blur-sm border-b border-blue-900/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation('home')}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/d2ad3974-e460-4312-a099-fac4fa8fcff3.png" 
                alt="SFAXIEN SCRIPTS Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SFAXIEN SCRIPTS</h1>
              <p className="text-xs text-blue-400">Premium FiveM Resources</p>
            </div>
          </div>

          {/* Desktop Navigation - Only show if not admin */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handleNavigation('home')}
                className="text-gray-300 hover:text-blue-400 transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavigation('SCRIPTS')}
                className="text-gray-300 hover:text-blue-400 transition-colors"
              >
                Scripts
              </button>
              <button 
                onClick={() => handleNavigation('YMAP')}
                className="text-gray-300 hover:text-blue-400 transition-colors"
              >
                YMAPs
              </button>
              <button 
                onClick={() => handleNavigation('CLOTHES')}
                className="text-gray-300 hover:text-blue-400 transition-colors"
              >
                Clothes
              </button>
            </nav>
          )}

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">
                  {isAdmin ? 'Admin Panel' : `Welcome, ${profile?.username || user.email}`}
                </span>
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-blue-400"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-blue-400"
                  onClick={handleAuthClick}
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-900/20">
            {!isAdmin && (
              <nav className="flex flex-col space-y-3 mt-4">
                <button 
                  onClick={() => handleNavigation('home')}
                  className="text-gray-300 hover:text-blue-400 transition-colors text-left"
                >
                  Home
                </button>
                <button 
                  onClick={() => handleNavigation('SCRIPTS')}
                  className="text-gray-300 hover:text-blue-400 transition-colors text-left"
                >
                  Scripts
                </button>
                <button 
                  onClick={() => handleNavigation('YMAP')}
                  className="text-gray-300 hover:text-blue-400 transition-colors text-left"
                >
                  YMAPs
                </button>
                <button 
                  onClick={() => handleNavigation('CLOTHES')}
                  className="text-gray-300 hover:text-blue-400 transition-colors text-left"
                >
                  Clothes
                </button>
              </nav>
            )}
            
            <div className="flex flex-col space-y-2 mt-4">
              {user ? (
                <>
                  <span className="text-gray-300 text-sm">
                    {isAdmin ? 'Admin Panel' : `Welcome, ${profile?.username || user.email}`}
                  </span>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-blue-400 justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-blue-400 justify-start"
                    onClick={handleAuthClick}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-800 justify-start">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
