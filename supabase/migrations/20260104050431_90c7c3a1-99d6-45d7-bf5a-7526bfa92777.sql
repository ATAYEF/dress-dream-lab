-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'clothing-images';

-- Drop the existing SELECT policy that allows anyone to view
DROP POLICY IF EXISTS "Users can view their own clothing images" ON storage.objects;

-- Create new SELECT policy that restricts viewing to folder owners only
CREATE POLICY "Users can view their own clothing images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'clothing-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );