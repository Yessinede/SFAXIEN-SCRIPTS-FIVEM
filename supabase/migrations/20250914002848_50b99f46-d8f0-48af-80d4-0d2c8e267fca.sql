ALTER TABLE public.ads 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days');

UPDATE public.ads 
SET expires_at = created_at + interval '7 days';