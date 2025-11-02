/*
  # Groups and Communities System

  1. New Tables
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `avatar_url` (text, nullable)
      - `cover_url` (text, nullable)
      - `is_private` (boolean)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `member_count` (integer)

    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role` (enum: admin, moderator, member)
      - `joined_at` (timestamptz)

    - `group_posts`
      - Links posts to groups

    - `group_invitations`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `inviter_id` (uuid, foreign key)
      - `invitee_id` (uuid, foreign key)
      - `status` (enum: pending, accepted, rejected)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for group members to access group data
    - Add policies for admins to manage groups
*/

-- Group role enum
DO $$ BEGIN
  CREATE TYPE group_role AS ENUM ('admin', 'moderator', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Invitation status enum
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  avatar_url text,
  cover_url text,
  is_private boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  member_count integer DEFAULT 1
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role group_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Group posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, post_id)
);

ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;

-- Group invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  inviter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invitee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status invitation_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_post ON group_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations(invitee_id, status);

-- RLS Policies for groups
CREATE POLICY "Anyone can view public groups"
  ON groups FOR SELECT
  TO authenticated
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Group admins can delete groups"
  ON groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- RLS Policies for group_members
CREATE POLICY "Group members can view other members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (NOT g.is_private OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = g.id
        AND gm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_id
      AND NOT is_private
    )
  );

CREATE POLICY "Group admins can add members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Group admins can remove members"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for group_posts
CREATE POLICY "Group members can view group posts"
  ON group_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = auth.uid()
      WHERE g.id = group_posts.group_id
      AND (NOT g.is_private OR gm.user_id IS NOT NULL)
    )
  );

CREATE POLICY "Group members can create posts in group"
  ON group_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Post authors and admins can delete group posts"
  ON group_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = group_posts.post_id
      AND p.author_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_posts.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for group_invitations
CREATE POLICY "Users can view their invitations"
  ON group_invitations FOR SELECT
  TO authenticated
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Group admins can create invitations"
  ON group_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invitations.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Invitees can update their invitations"
  ON group_invitations FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid());

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups
    SET member_count = member_count - 1
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for member count
DROP TRIGGER IF EXISTS on_group_member_change ON group_members;
CREATE TRIGGER on_group_member_change
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Function to create group atomically
CREATE OR REPLACE FUNCTION create_group_atomic(
  p_name text,
  p_description text,
  p_is_private boolean DEFAULT false,
  p_avatar_url text DEFAULT NULL,
  p_cover_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_group_id uuid;
BEGIN
  INSERT INTO groups (name, description, is_private, created_by, avatar_url, cover_url)
  VALUES (p_name, p_description, p_is_private, auth.uid(), p_avatar_url, p_cover_url)
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'admin');

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept group invitation
CREATE OR REPLACE FUNCTION accept_group_invitation(p_invitation_id uuid)
RETURNS void AS $$
DECLARE
  v_group_id uuid;
  v_invitee_id uuid;
BEGIN
  SELECT group_id, invitee_id INTO v_group_id, v_invitee_id
  FROM group_invitations
  WHERE id = p_invitation_id
  AND invitee_id = auth.uid()
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;

  UPDATE group_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = p_invitation_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_invitee_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
