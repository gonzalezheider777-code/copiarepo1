/*
  # Create Reposts/Shares Table

  1. New Tables
    - `reposts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `post_id` (uuid, foreign key to posts)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on reposts table
    - Users can create reposts
    - Users can delete their own reposts
    - Users can view all reposts

  3. Notes
    - A repost represents a user sharing/reposting another user's post
    - Users cannot repost the same post multiple times (unique constraint)
    - Reposts appear in the feed as if the user shared the original content
*/

-- Create reposts table
CREATE TABLE IF NOT EXISTS reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reposts_user ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_created ON reposts(created_at DESC);

-- RLS Policies for reposts
CREATE POLICY "Anyone can view reposts"
  ON reposts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reposts"
  ON reposts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reposts"
  ON reposts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to get repost count for a post
CREATE OR REPLACE FUNCTION get_repost_count(p_post_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM reposts WHERE post_id = p_post_id;
$$ LANGUAGE sql STABLE;

-- Function to check if user has reposted a post
CREATE OR REPLACE FUNCTION has_user_reposted(p_post_id uuid, p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM reposts
    WHERE post_id = p_post_id AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE;
