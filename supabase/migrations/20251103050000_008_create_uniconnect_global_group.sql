/*
  # Create UniConnect Global Group

  1. Changes
    - Create a global UniConnect group that all users can access
    - Create a conversation for the global group
    - Add a trigger to automatically add new users to the group
    - Add is_group_chat column to conversations table

  2. Details
    - The UniConnect group will have a fixed UUID for easy reference
    - All authenticated users can send messages to this group
    - New users are automatically added when they sign up
*/

-- Add is_group_chat and group_name columns to conversations if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'is_group_chat'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_group_chat boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE conversations ADD COLUMN group_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'group_avatar'
  ) THEN
    ALTER TABLE conversations ADD COLUMN group_avatar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'member_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN member_count integer DEFAULT 0;
  END IF;
END $$;

-- Create the global UniConnect group conversation with a fixed UUID
INSERT INTO conversations (
  id,
  is_group_chat,
  group_name,
  group_avatar,
  created_at,
  updated_at,
  last_message_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  true,
  'UniConnect',
  'https://api.dicebear.com/7.x/shapes/svg?seed=UniConnect&backgroundColor=3b82f6',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Update RLS policy for group chats - allow viewing if it's a group chat
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    is_group_chat = true OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow all authenticated users to send messages to group chats
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND conversations.is_group_chat = true
      )
    )
  );

-- Allow users to update messages in group chats
DROP POLICY IF EXISTS "Users can update their messages" ON messages;
CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Allow users to delete their messages
DROP POLICY IF EXISTS "Users can delete their messages" ON messages;
CREATE POLICY "Users can delete their messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Function to add new users to UniConnect group
CREATE OR REPLACE FUNCTION add_user_to_uniconnect_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Add user to UniConnect global group
  INSERT INTO conversation_participants (
    conversation_id,
    user_id,
    joined_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    NEW.id,
    now()
  ) ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Update member count
  UPDATE conversations
  SET member_count = (
    SELECT COUNT(*) FROM conversation_participants
    WHERE conversation_id = '00000000-0000-0000-0000-000000000001'
  )
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add new users to UniConnect group
DROP TRIGGER IF EXISTS on_profile_created_add_to_uniconnect ON profiles;
CREATE TRIGGER on_profile_created_add_to_uniconnect
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_uniconnect_group();

-- Add all existing users to the UniConnect group
INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
SELECT '00000000-0000-0000-0000-000000000001', id, now()
FROM profiles
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Update initial member count
UPDATE conversations
SET member_count = (
  SELECT COUNT(*) FROM conversation_participants
  WHERE conversation_id = '00000000-0000-0000-0000-000000000001'
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Function to update conversation member count
CREATE OR REPLACE FUNCTION update_conversation_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE conversations
    SET member_count = member_count + 1
    WHERE id = NEW.conversation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE conversations
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.conversation_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for conversation member count
DROP TRIGGER IF EXISTS on_conversation_participant_change ON conversation_participants;
CREATE TRIGGER on_conversation_participant_change
  AFTER INSERT OR DELETE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_member_count();
