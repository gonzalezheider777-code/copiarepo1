import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { PostCard } from "@/components/PostCard";
import { Bookmark, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Post } from "@/hooks/useFeed";
import { useToast } from "@/hooks/use-toast";

const Saved = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSavedPosts();
    }
  }, [user]);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("saved_posts")
        .select(`
          post_id,
          created_at,
          posts (
            *,
            profiles:user_id (
              id,
              username,
              avatar_url,
              career,
              institution_name
            )
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (data || []).map(async (item: any) => {
          const post = item.posts;
          if (!post) return null;

          const [reactionsResult, commentsResult, userReactionResult] = await Promise.all([
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
              .eq("user_id", user?.id)
              .maybeSingle(),
          ]);

          return {
            ...post,
            reactions_count: reactionsResult.count || 0,
            comments_count: commentsResult.count || 0,
            user_reaction: userReactionResult.data?.reaction_type,
            is_saved: true,
          };
        })
      );

      setSavedPosts(postsWithCounts.filter(Boolean) as Post[]);
    } catch (error: any) {
      console.error("Error loading saved posts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones guardadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: "Eliminado de guardados" });
    } catch (error: any) {
      console.error("Error unsaving post:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const { data: existingSameType } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user?.id)
        .eq("reaction_type", reactionType)
        .maybeSingle();

      if (existingSameType) {
        await supabase
          .from("reactions")
          .delete()
          .eq("id", existingSameType.id);

        setSavedPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, reactions_count: Math.max(0, (p.reactions_count || 1) - 1), user_reaction: undefined }
              : p
          )
        );
      } else {
        const { data: existingDifferentType } = await supabase
          .from("reactions")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user?.id)
          .maybeSingle();

        if (existingDifferentType) {
          await supabase
            .from("reactions")
            .update({ reaction_type: reactionType })
            .eq("id", existingDifferentType.id);

          setSavedPosts(prev =>
            prev.map(p =>
              p.id === postId
                ? { ...p, user_reaction: reactionType }
                : p
            )
          );
        } else {
          await supabase
            .from("reactions")
            .insert({ post_id: postId, user_id: user?.id, reaction_type: reactionType });

          setSavedPosts(prev =>
            prev.map(p =>
              p.id === postId
                ? { ...p, reactions_count: (p.reactions_count || 0) + 1, user_reaction: reactionType }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <main className="pt-4">
        <div className="bg-card border-y border-border mb-6">
          <div className="px-4 py-5 max-w-screen-xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Publicaciones Guardadas</h1>
                <p className="text-sm text-muted-foreground">
                  {savedPosts.length} {savedPosts.length === 1 ? "publicación" : "publicaciones"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedPosts.length > 0 ? (
            savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReaction={handleReaction}
                onSave={handleUnsave}
              />
            ))
          ) : (
            <div className="bg-card border-y border-border">
              <div className="text-center py-16 px-4">
                <Bookmark className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
                <h2 className="text-xl font-bold text-foreground mb-2">No tienes publicaciones guardadas</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Cuando encuentres publicaciones interesantes, puedes guardarlas aquí para verlas más tarde.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Saved;
