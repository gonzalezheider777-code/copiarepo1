/*
  # Create Idea Participants Table

  1. New Tables
    - `idea_participants`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts table)
      - `user_id` (uuid, foreign key to profiles table)
      - `joined_at` (timestamptz)
      
  2. Security
    - Enable RLS on `idea_participants` table
    - Add policy for users to view participants of public ideas
    - Add policy for users to join ideas
    - Add policy for users to leave ideas (delete their own participation)
    
  3. Constraints
    - Unique constraint on (post_id, user_id) to prevent duplicate joins
*/

CREATE TABLE IF NOT EXISTS idea_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE idea_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view idea participants"
  ON idea_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join ideas"
  ON idea_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave ideas"
  ON idea_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_idea_participants_post_id ON idea_participants(post_id);
CREATE INDEX IF NOT EXISTS idx_idea_participants_user_id ON idea_participants(user_id);