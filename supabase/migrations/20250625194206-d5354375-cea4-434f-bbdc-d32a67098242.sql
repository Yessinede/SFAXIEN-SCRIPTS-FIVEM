
INSERT INTO storage.buckets (id, name, public)
VALUES ('script-assets', 'script-assets', true);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scripts" ON public.scripts
FOR SELECT USING (true);

CREATE POLICY "Only admin can insert scripts" ON public.scripts
FOR INSERT WITH CHECK (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

CREATE POLICY "Only admin can update scripts" ON public.scripts
FOR UPDATE USING (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

CREATE POLICY "Only admin can delete scripts" ON public.scripts
FOR DELETE USING (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Only admin can manage categories" ON public.categories
FOR ALL USING (
  auth.email() = 'ghorbelyessine01@gmail.com'
);

CREATE POLICY "Anyone can view script assets" ON storage.objects
FOR SELECT USING (bucket_id = 'script-assets');

CREATE POLICY "Only admin can upload script assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'script-assets' AND
  auth.email() = 'ghorbelyessine01@gmail.com'
);
