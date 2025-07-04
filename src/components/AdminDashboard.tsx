
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Plus, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

export const AdminDashboard = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Form state
  const [scriptName, setScriptName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);

  // Required categories
  const requiredCategories = [
    { name: 'SCRIPTS', description: 'FiveM Scripts and Resources' },
    { name: 'CLOTHES', description: 'FiveM Clothing and Accessories' },
    { name: 'YMAP', description: 'FiveM Map Files and Locations' }
  ];

  useEffect(() => {
    initializeCategories();
    fetchData();
  }, []);

  const initializeCategories = async () => {
    try {
      for (const categoryData of requiredCategories) {
        const { error } = await supabase
          .from('categories')
          .upsert({ 
            name: categoryData.name,
            description: categoryData.description
          }, { 
            onConflict: 'name',
            ignoreDuplicates: true 
          });
        
        if (error && !error.message.includes('duplicate')) {
          console.error('Error creating category:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [categoriesRes, scriptsRes] = await Promise.all([
        supabase.from('categories').select('*').in('name', requiredCategories.map(c => c.name)).order('name'),
        supabase.from('scripts').select('*, categories(name)').order('created_at', { ascending: false })
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (scriptsRes.error) throw scriptsRes.error;

      setCategories(categoriesRes.data || []);
      setScripts(scriptsRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptName || !description || !selectedCategory || !scriptFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = '';
      let fileUrl = '';

      // Upload image if provided
      if (imageFile) {
        const imageExt = imageFile.name.split('.').pop();
        const imageName = `${Date.now()}_image.${imageExt}`;
        const { error: imageError, data: imageData } = await supabase.storage
          .from('script-assets')
          .upload(imageName, imageFile);

        if (imageError) throw imageError;
        
        // Get public URL for the uploaded image
        const { data: imageUrlData } = supabase.storage
          .from('script-assets')
          .getPublicUrl(imageName);
        imageUrl = imageUrlData.publicUrl;
      }

      // Upload script file
      const fileExt = scriptFile.name.split('.').pop();
      const fileName = `${Date.now()}_script.${fileExt}`;
      const { error: fileError, data: fileData } = await supabase.storage
        .from('script-assets')
        .upload(fileName, scriptFile);

      if (fileError) throw fileError;
      
      // Get public URL for the uploaded file
      const { data: fileUrlData } = supabase.storage
        .from('script-assets')
        .getPublicUrl(fileName);
      fileUrl = fileUrlData.publicUrl;

      // Insert script record
      const { error: insertError } = await supabase
        .from('scripts')
        .insert({
          name: scriptName,
          description,
          price: parseFloat(price),
          category_id: selectedCategory,
          image_url: imageUrl,
          file_url: fileUrl
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Script uploaded successfully!"
      });

      // Reset form
      setScriptName('');
      setDescription('');
      setPrice('0');
      setSelectedCategory('');
      setImageFile(null);
      setScriptFile(null);
      
      // Reset file inputs
      const imageInput = document.getElementById('image') as HTMLInputElement;
      const scriptInput = document.getElementById('script') as HTMLInputElement;
      if (imageInput) imageInput.value = '';
      if (scriptInput) scriptInput.value = '';
      
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteScript = async (scriptId: string, scriptName: string) => {
    if (!confirm(`Are you sure you want to delete "${scriptName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Script "${scriptName}" deleted successfully`
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        {profile && (
          <span className="text-gray-400">Welcome, {profile.username}</span>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card className="bg-gray-900 border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-white">Upload New Script</CardTitle>
            <CardDescription className="text-gray-400">
              Add a new script to your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="scriptName" className="text-white">Script Name</Label>
                <Input
                  id="scriptName"
                  value={scriptName}
                  onChange={(e) => setScriptName(e.target.value)}
                  className="bg-black border-blue-800/50 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-black border-blue-800/50 text-white"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-black border-blue-800/50 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price" className="text-white">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-black border-blue-800/50 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image" className="text-white">Preview Image (optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="bg-black border-blue-800/50 text-white file:text-white"
                />
              </div>

              <div>
                <Label htmlFor="script" className="text-white">Script File (ZIP)</Label>
                <Input
                  id="script"
                  type="file"
                  accept=".zip"
                  onChange={(e) => setScriptFile(e.target.files?.[0] || null)}
                  className="bg-black border-blue-800/50 text-white file:text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
              >
                {uploading ? 'Uploading...' : 'Upload Script'}
                <Upload className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scripts List */}
        <Card className="bg-gray-900 border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-white">Your Scripts ({scripts.length})</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your uploaded scripts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {scripts.map((script) => (
                <div key={script.id} className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{script.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{script.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-400">{script.categories?.name}</span>
                        <span className="text-green-400">
                          {script.price === 0 ? 'FREE' : `$${script.price}`}
                        </span>
                        <span className="text-gray-400">{script.downloads} downloads</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {script.image_url && (
                        <img
                          src={script.image_url}
                          alt={script.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteScript(script.id, script.name)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {scripts.length === 0 && (
                <p className="text-gray-400 text-center py-8">No scripts uploaded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
