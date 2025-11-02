import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PostType = "text" | "idea" | "proyecto" | "equipo" | "evento" | "academic_event";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: PostType;
  media_url?: string;
  media_type?: string;
  visibility: string;
  idea?: any;
  project_status?: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
    career?: string;
    institution_name?: string;
  };
  reactions_count?: number;
  comments_count?: number;
  user_reaction?: string;
  is_saved?: boolean;
}

export const useFeed = (filterType: string = "all", limit: number = 20) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts(true);
  }, [filterType]);

  const loadPosts = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const from = currentPage * limit;
      const to = from + limit - 1;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            career,
            institution_name
          )
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filterType !== "all") {
        query = query.eq("post_type", filterType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [reactionsResult, commentsResult, userReactionResult, savedResult] = await Promise.all([
            supabase
              .from("reactions")
              .select("id", { count: "exact" })
              .eq("post_id", post.id),
            supabase
              .from("comments")
              .select("id", { count: "exact" })
              .eq("post_id", post.id),
            supabase
              .from("reactions")
              .select("reaction_type")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("saved_posts")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle()
          ]);

          return {
            ...post,
            reactions_count: reactionsResult.count || 0,
            comments_count: commentsResult.count || 0,
            user_reaction: userReactionResult.data?.reaction_type,
            is_saved: !!savedResult.data
          };
        })
      );

      if (reset) {
        setPosts(postsWithCounts);
      } else {
        setPosts(prev => [...prev, ...postsWithCounts]);
      }

      setHasMore(postsWithCounts.length === limit);
      setPage(reset ? 1 : currentPage + 1);
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  };

  const refreshFeed = () => {
    loadPosts(true);
  };

  const addReaction = async (postId: string, reactionType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("reaction_type", reactionType)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("reactions")
          .delete()
          .eq("id", existing.id);

        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, reactions_count: (post.reactions_count || 1) - 1, user_reaction: undefined }
              : post
          )
        );
      } else {
        await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        await supabase
          .from("reactions")
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });

        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, reactions_count: (post.reactions_count || 0) + 1, user_reaction: reactionType }
              : post
          )
        );
      }
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la reacción",
        variant: "destructive",
      });
    }
  };

  const toggleSave = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_saved) {
        await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        setPosts(prev =>
          prev.map(p => p.id === postId ? { ...p, is_saved: false } : p)
        );

        toast({ title: "Eliminado de guardados" });
      } else {
        await supabase
          .from("saved_posts")
          .insert({ post_id: postId, user_id: user.id });

        setPosts(prev =>
          prev.map(p => p.id === postId ? { ...p, is_saved: true } : p)
        );

        toast({ title: "Guardado exitosamente" });
      }
    } catch (error: any) {
      console.error("Error toggling save:", error);
    }
  };

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refreshFeed,
    addReaction,
    toggleSave
  };
};
