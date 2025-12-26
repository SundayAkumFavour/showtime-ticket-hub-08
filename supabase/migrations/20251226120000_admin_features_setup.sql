-- Function to atomically increment ticket sold count
CREATE OR REPLACE FUNCTION public.increment_ticket_sold(tier_id uuid, quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ticket_tiers
  SET sold = sold + quantity
  WHERE id = tier_id;
END;
$$;

-- Create a storage bucket for show images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('show-images', 'show-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'show-images' );

-- Policy: Allow authenticated users (specifically admins) to upload
-- Note: Ideally we'd restrict this to role='admin', but storage policies 
-- can be tricky with custom claims. For now, authenticated users (admins manage shows) is a good step.
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'show-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'show-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'show-images' AND auth.role() = 'authenticated' );
