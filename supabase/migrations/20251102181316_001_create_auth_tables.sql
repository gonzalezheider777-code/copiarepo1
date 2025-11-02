/*
  # Create Authentication and Profile Tables

  1. New Tables
    - `profiles` - User profile information linked to auth.users
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `email` (text)
      - `avatar_url` (text)
      - `cover_url` (text)
      - `bio` (text)
      - `career` (text)
      - `semester` (text)
      - `institution_name` (text)
      - `academic_role` (text)
      - `status` (text)
      - `relationship_status` (text)
      - `birth_date` (date)
      - `last_seen` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for user access control
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  avatar_url text,
  cover_url text,
  bio text,
  career text,
  semester text,
  institution_name text,
  academic_role text DEFAULT 'estudiante',
  status text,
  relationship_status text,
  birth_date date,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_institution ON profiles(institution_name);
CREATE INDEX idx_profiles_career ON profiles(career);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all public profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
