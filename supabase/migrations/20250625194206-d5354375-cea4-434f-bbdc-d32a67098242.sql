
-- Create storage bucket for script files and images
INSERT INTO storage.buckets (id, name, public)
VALUES ('script-assets', 'script-assets', true);

-- Create RLS policies for the scripts table (only admin can manage)
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read scripts (for the public store)
CREATE POLICY "Anyone can view scripts" ON public.scripts
FOR SELECT USING (true);

-- Only allow the admin email to insert scripts
CREATE POLICY "Only admin can insert scripts" ON public.scripts
FOR INSERT WITH CHECK (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

-- Only allow the admin email to update scripts
CREATE POLICY "Only admin can update scripts" ON public.scripts
FOR UPDATE USING (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

-- Only allow the admin email to delete scripts
CREATE POLICY "Only admin can delete scripts" ON public.scripts
FOR DELETE USING (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

-- Create RLS policies for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories
CREATE POLICY "Anyone can view categories" ON public.categories
FOR SELECT USING (true);

-- Only allow the admin email to manage categories
CREATE POLICY "Only admin can manage categories" ON public.categories
FOR ALL USING (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

-- Create storage policies for the script-assets bucket
CREATE POLICY "Anyone can view script assets" ON storage.objects
FOR SELECT USING (bucket_id = 'script-assets');

CREATE POLICY "Only admin can upload script assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'script-assets' AND
  auth.email() = 'ghorbelyessine01@gmail.com'
);
