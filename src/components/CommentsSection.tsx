import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
  user_liked?: boolean;
}

interface CommentsSectionProps {
  postId: string;
  initialComments?: any[];
}

export const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const commentsWithLikes = await Promise.all(
        (data || []).map(async (comment) => {
          const [likesResult, userLikeResult] = await Promise.all([
            supabase
              .from("reactions")
              .select("id", { count: "exact" })
              .eq("comment_id", comment.id),
            user
              ? supabase
                  .from("reactions")
                  .select("id")
                  .eq("comment_id", comment.id)
                  .eq("user_id", user.id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...comment,
            likes_count: likesResult.count || 0,
            user_liked: !!userLikeResult.data,
          };
        })
      );

      setComments(commentsWithLikes);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setPosting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Comentario publicado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      if (comment.user_liked) {
        await supabase
          .from("reactions")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likes_count: (c.likes_count || 1) - 1,
                  user_liked: false,
                }
              : c
          )
        );
      } else {
        await supabase.from("reactions").insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: "like",
        });

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likes_count: (c.likes_count || 0) + 1,
                  user_liked: true,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-5">
      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {user?.email?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={posting}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || posting}
            className="h-11 w-11 flex-shrink-0"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={comment.profiles.avatar_url} />
                <AvatarFallback className="bg-muted text-foreground text-sm">
                  {comment.profiles.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-2xl px-4 py-2.5">
                  <p className="font-semibold text-sm text-foreground mb-1">
                    {comment.profiles.username}
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-1.5 px-2">
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className={`text-xs font-medium transition-colors ${
                      comment.user_liked
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    Me gusta {comment.likes_count ? `· ${comment.likes_count}` : ""}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        )}
      </div>
    </div>
  );
};
