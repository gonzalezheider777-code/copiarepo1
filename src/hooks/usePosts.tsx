import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadPostMedia, deleteMedia } from "@/lib/storage";

export type PostType = "text" | "idea" | "proyecto" | "equipo" | "evento" | "academic_event";

interface CreatePostData {
  content: string;
  post_type: PostType;
  media_file?: File;
  visibility?: "public" | "friends" | "private";
  idea?: any;
  project_status?: string;
  group_id?: string;
}

export const usePosts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPost = async (data: CreatePostData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      let media_url = null;
      let media_type = null;

      // Upload media if provided
      if (data.media_file) {
        const result = await uploadPostMedia(data.media_file);
        if (result.url) {
          media_url = result.url;
          media_type = data.media_file.type.startsWith("image") ? "image" : "video";
        }
      }

      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: data.content,
          post_type: data.post_type,
          media_url,
          media_type,
          visibility: data.visibility || "public",
          idea: data.idea,
          project_status: data.project_status,
          group_id: data.group_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Publicado",
        description: "Tu publicación ha sido creada exitosamente",
      });

      setLoading(false);
      return { data: post, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return { data: null, error };
    }
  };

  const deletePost = async (postId: string) => {
    setLoading(true);
    try {
      // Get post to delete media
      const { data: post } = await supabase
        .from("posts")
        .select("media_url")
        .eq("id", postId)
        .single();

      if (post?.media_url) {
        await deleteMedia(post.media_url);
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "La publicación ha sido eliminada",
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

  const updatePost = async (postId: string, content: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Actualizado",
        description: "La publicación ha sido actualizada",
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

  const toggleSavePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Check if already saved
      const { data: existing } = await supabase
        .from("saved_posts")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

      if (existing) {
        // Unsave
        await supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);

        toast({
          title: "Eliminado de guardados",
        });
      } else {
        // Save
        await supabase
          .from("saved_posts")
          .insert({ user_id: user.id, post_id: postId });

        toast({
          title: "Guardado",
          description: "Publicación guardada exitosamente",
        });
      }

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

  const hidePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      await supabase
        .from("hidden_posts")
        .insert({ user_id: user.id, post_id: postId });

      toast({
        title: "Ocultado",
        description: "Esta publicación ya no aparecerá en tu feed",
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

  const reportPost = async (postId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      await supabase
        .from("post_reports")
        .insert({ user_id: user.id, post_id: postId, reason });

      toast({
        title: "Reportado",
        description: "Gracias por tu reporte, lo revisaremos pronto",
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

  const joinIdea = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("idea_participants")
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;

      toast({
        title: "¡Te has unido!",
        description: "Ahora eres parte de esta idea",
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

  const leaveIdea = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("idea_participants")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Has salido",
        description: "Ya no eres parte de esta idea",
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

  const getIdeaParticipants = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("idea_participants")
        .select(`
          user_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  return {
    loading,
    createPost,
    deletePost,
    updatePost,
    toggleSavePost,
    hidePost,
    reportPost,
    joinIdea,
    leaveIdea,
    getIdeaParticipants,
  };
};
