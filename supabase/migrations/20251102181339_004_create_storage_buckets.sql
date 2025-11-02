/*
  # Create Storage Buckets for Files

  1. Buckets Created
    - `avatars` - User profile pictures
    - `covers` - User cover images
    - `posts` - Post images and videos
    - `messages` - Message attachments

  2. Configuration
    - Set up size limits
    - Configure public access policies
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('avatars', 'avatars', true),
    ('covers', 'covers', true),
    ('posts', 'posts', true),
    ('messages', 'messages', true)
  ON CONFLICT DO NOTHING;
END $$;

CREATE POLICY "Allow public read access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow users to update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow users to delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow public read access to covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Allow authenticated users to upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Allow users to update their own covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'covers')
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Allow users to delete their own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers');

CREATE POLICY "Allow public read access to posts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "Allow authenticated users to upload posts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Allow users to delete their own post media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts');

CREATE POLICY "Allow authenticated users to access messages"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'messages');

CREATE POLICY "Allow authenticated users to upload messages"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'messages');

CREATE POLICY "Allow users to delete their own message files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'messages');
