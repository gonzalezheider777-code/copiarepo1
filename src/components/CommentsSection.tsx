import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Loader2, MoreVertical, Pencil, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  replies?: Comment[];
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
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
          const [likesResult, userLikeResult, repliesData] = await Promise.all([
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
            supabase
              .from("comments")
              .select(`
                *,
                profiles:user_id (
                  username,
                  avatar_url
                )
              `)
              .eq("parent_id", comment.id)
              .order("created_at", { ascending: true }),
          ]);

          const repliesWithLikes = await Promise.all(
            (repliesData.data || []).map(async (reply) => {
              const [replyLikesResult, replyUserLikeResult] = await Promise.all([
                supabase
                  .from("reactions")
                  .select("id", { count: "exact" })
                  .eq("comment_id", reply.id),
                user
                  ? supabase
                      .from("reactions")
                      .select("id")
                      .eq("comment_id", reply.id)
                      .eq("user_id", user.id)
                      .maybeSingle()
                  : Promise.resolve({ data: null }),
              ]);

              return {
                ...reply,
                likes_count: replyLikesResult.count || 0,
                user_liked: !!replyUserLikeResult.data,
              };
            })
          );

          return {
            ...comment,
            likes_count: likesResult.count || 0,
            user_liked: !!userLikeResult.data,
            replies: repliesWithLikes,
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

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;

    setPosting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId,
      });

      if (error) throw error;

      setReplyContent("");
      setReplyToCommentId(null);
      await loadComments();
      toast({
        title: "Respuesta publicada",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo publicar la respuesta",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", commentId);

      if (error) throw error;

      setEditingCommentId(null);
      setEditContent("");
      await loadComments();
      toast({
        title: "Comentario actualizado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el comentario",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentToDelete);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      await loadComments();
      toast({
        title: "Comentario eliminado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      });
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const startReply = (commentId: string) => {
    setReplyToCommentId(commentId);
    setReplyContent("");
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;

    try {
      const findComment = (comments: Comment[]): Comment | undefined => {
        for (const c of comments) {
          if (c.id === commentId) return c;
          if (c.replies) {
            const found = c.replies.find((r) => r.id === commentId);
            if (found) return found;
          }
        }
        return undefined;
      };

      const comment = findComment(comments);
      if (!comment) return;

      if (comment.user_liked) {
        await supabase
          .from("reactions")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("reactions").insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: "like",
        });
      }

      await loadComments();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwnComment = user?.id === comment.user_id;
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyToCommentId === comment.id;

    return (
      <div key={comment.id} className={isReply ? "ml-12" : ""}>
        <div className="flex gap-3">
          <Link to={`/profile/${comment.profiles.username}`} className="flex-shrink-0">
            <Avatar className="h-9 w-9 hover:ring-2 hover:ring-primary transition-all cursor-pointer">
              <AvatarImage src={comment.profiles.avatar_url} />
              <AvatarFallback className="bg-muted text-foreground text-sm">
                {comment.profiles.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="bg-muted/50 rounded-2xl px-4 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/profile/${comment.profiles.username}`}>
                  <p className="font-semibold text-sm text-foreground mb-1 hover:underline cursor-pointer inline-block">
                    {comment.profiles.username}
                  </p>
                </Link>
                {isOwnComment && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(comment)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(comment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditContent("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground/90 leading-relaxed break-words">
                  {comment.content}
                </p>
              )}
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
              {!isReply && (
                <button
                  onClick={() => startReply(comment.id)}
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Responder
                </button>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>

            {isReplying && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="min-h-[60px] text-sm"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || posting}
                    className="h-9 w-9"
                  >
                    {posting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setReplyToCommentId(null);
                      setReplyContent("");
                    }}
                    className="h-9 w-9"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
          comments.map((comment) => renderComment(comment))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
