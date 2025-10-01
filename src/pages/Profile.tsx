import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Heart, Calendar, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Script {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  rating: number | null;
  categories?: { name: string };
}

interface DownloadHistory {
  id: string;
  created_at: string;
  scripts: Script;
}

interface FavoriteScript {
  id: string;
  created_at: string;
  scripts: Script;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
  const [favorites, setFavorites] = useState<FavoriteScript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const { data: downloadsData } = await supabase
        .from('downloads')
        .select(`
          id,
          created_at,
          scripts!inner (
            id,
            name,
            description,
            price,
            image_url,
            rating,
            categories (name)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: favoritesData } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          scripts!inner (
            id,
            name,
            description,
            price,
            image_url,
            rating,
            categories (name)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setDownloads((downloadsData as any) || []);
      setFavorites((favoritesData as any) || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="bg-gray-900/50 border-gray-700 p-8">
            <CardContent className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
              <p className="text-gray-400">Please login to view your profile</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const ScriptCard = ({ script }: { script: Script }) => (
    <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-500/50 transition-all duration-300">
      <CardHeader className="pb-3">
        {script.image_url && (
          <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-800">
            <img
              src={script.image_url}
              alt={script.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardTitle className="text-white text-lg">{script.name}</CardTitle>
        <p className="text-gray-400 text-sm line-clamp-2">{script.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {script.categories && (
          <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-600">
            {script.categories.name}
          </Badge>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="h-4 w-4" />
            <span className="text-sm">{script.rating ? script.rating.toFixed(1) : '0.0'}</span>
          </div>
          <Badge variant={script.price === 0 ? "default" : "secondary"} 
                 className={script.price === 0 ? "bg-green-900/50 text-green-400 border-green-600" : "bg-orange-900/50 text-orange-400 border-orange-600"}>
            {script.price === 0 ? 'FREE' : `${script.price} BNB`}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400">Manage your downloads and favorites</p>
          </div>

          <Tabs defaultValue="downloads" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border-gray-700">
              <TabsTrigger 
                value="downloads" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Recent Downloads
              </TabsTrigger>
              <TabsTrigger 
                value="favorites" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="downloads" className="mt-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Recent Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading downloads...</p>
                    </div>
                  ) : downloads.length === 0 ? (
                    <div className="text-center py-8">
                      <Download className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No downloads yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {downloads.map((download) => (
                        <div key={download.id} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-white font-medium">{download.scripts.name}</h3>
                              <p className="text-gray-400 text-sm">{download.scripts.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <Calendar className="h-4 w-4" />
                                {new Date(download.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Favorite Scripts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading favorites...</p>
                    </div>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No favorites yet</p>
                      <p className="text-gray-500 text-sm mt-2">Click the heart icon on scripts to add them to favorites</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map((favorite) => (
                        <ScriptCard key={favorite.id} script={favorite.scripts} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}