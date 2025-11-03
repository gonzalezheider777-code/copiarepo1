import { supabase } from "@/integrations/supabase/client";
import { uploadToR2, deleteFromR2, extractR2Key } from "./r2Storage";

export const uploadAvatar = async (file: File, userId: string) => {
  try {
    const { url, key } = await uploadToR2(file, "avatars");
    return { url, error: null };
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return { url: null, error };
  }
};

export const uploadCoverImage = async (file: File, userId: string) => {
  try {
    const { url, key } = await uploadToR2(file, "covers");
    return { url, error: null };
  } catch (error: any) {
    console.error("Error uploading cover:", error);
    return { url: null, error };
  }
};

export const uploadPostMedia = async (file: File) => {
  try {
    const { url, key } = await uploadToR2(file, "posts");
    return { url, error: null };
  } catch (error: any) {
    console.error("Error uploading media:", error);
    return { url: null, error };
  }
};

export const deleteMedia = async (url: string) => {
  try {
    const key = extractR2Key(url);
    if (!key) return;

    await deleteFromR2(key);
  } catch (error) {
    console.error("Error deleting media:", error);
  }
};
