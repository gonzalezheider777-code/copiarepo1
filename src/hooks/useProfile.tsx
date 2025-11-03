import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadAvatar, uploadCoverImage } from "@/lib/storage";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  career?: string;
  semester?: string;
  institution_name?: string;
  academic_role?: string;
  status?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados",
      });

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return { error };
    }
  };

  const updateAvatar = async (file: File) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const result = await uploadAvatar(file, user.id);
      if (!result.url) throw new Error("Error al subir imagen");

      await updateProfile({ avatar_url: result.url });

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return { error };
    }
  };

  const updateCover = async (file: File) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const result = await uploadCoverImage(file, user.id);
      if (!result.url) throw new Error("Error al subir imagen");

      await updateProfile({ cover_url: result.url });

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return { error };
    }
  };

  const followUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("followers")
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      toast({
        title: "Ahora sigues a este usuario",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const unfollowUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) throw error;

      toast({
        title: "Dejaste de seguir a este usuario",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const checkIfFollowing = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isFollowing: false, error: null };

      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();

      if (error) throw error;
      return { isFollowing: !!data, error: null };
    } catch (error: any) {
      return { isFollowing: false, error };
    }
  };

  const getFollowersCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error: any) {
      return { count: 0, error };
    }
  };

  const getFollowingCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error: any) {
      return { count: 0, error };
    }
  };

  return {
    profile,
    loading,
    loadProfile,
    getProfile,
    updateProfile,
    updateAvatar,
    updateCover,
    followUser,
    unfollowUser,
    checkIfFollowing,
    getFollowersCount,
    getFollowingCount,
  };
};
