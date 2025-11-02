import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Lightbulb, Flame, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ImageLightbox } from "./ImageLightbox";
import { CommentsSection } from "./CommentsSection";
import { PostMenu } from "./PostMenu";
import { Post } from "@/hooks/useFeed";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PostCardProps {
  post: Post;
  onReaction: (postId: string, reactionType: string) => void;
  onSave: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const PostCard = ({ post, onReaction, onSave, onDelete }: PostCardProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  const reactions = [
    { icon: ThumbsUp, label: "like", color: "text-blue-600" },
    { icon: Heart, label: "love", color: "text-red-600" },
    { icon: Lightbulb, label: "idea", color: "text-yellow-600" },
    { icon: Flame, label: "fire", color: "text-orange-600" },
  ];

  const getReactionIcon = (type?: string) => {
    switch (type) {
      case "like": return ThumbsUp;
      case "love": return Heart;
      case "idea": return Lightbulb;
      case "fire": return Flame;
      default: return Heart;
    }
  };

  const ReactionIcon = post.user_reaction ? getReactionIcon(post.user_reaction) : Heart;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: es,
  });

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "El enlace de la publicación se copió al portapapeles",
    });
  };

  const getPostTypeLabel = () => {
    switch (post.post_type) {
      case "idea": return "💡 Idea";
      case "proyecto": return "🚀 Proyecto";
      case "evento": return "📅 Evento";
      case "equipo": return "👥 Equipo";
      default: return null;
    }
  };

  return (
    <div className="bg-card border-b border-border transition-all duration-200 hover:bg-card/50">
      <div className="px-4 py-5 max-w-screen-xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-11 w-11 ring-1 ring-border flex-shrink-0">
            <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.username} />
            <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
              {post.profiles.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
              {post.profiles.username}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {post.profiles.career && post.profiles.institution_name
                ? `${post.profiles.career} • ${post.profiles.institution_name}`
                : post.profiles.career || post.profiles.institution_name || "Usuario"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
          </div>
          <div className="flex items-start gap-2">
            {getPostTypeLabel() && (
              <Badge
                variant="default"
                className="text-xs font-medium px-2.5 py-0.5 whitespace-nowrap rounded"
              >
                {getPostTypeLabel()}
              </Badge>
            )}
            <PostMenu
              postId={post.id}
              isOwnPost={false}
              onDelete={onDelete}
            />
          </div>
        </div>

        <div className="space-y-4">
          {post.content && (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {post.media_url && post.media_type === "image" && (
            <div
              className="rounded overflow-hidden border border-border cursor-pointer group"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full h-auto object-cover max-h-96 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-5 pt-4 border-t border-border">
          <div className="relative flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full gap-2 transition-colors ${
                post.user_reaction
                  ? "text-primary hover:bg-primary/5"
                  : "hover:bg-primary/5 hover:text-primary"
              }`}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              <ReactionIcon className={`h-4 w-4 ${post.user_reaction ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.reactions_count || 0}</span>
            </Button>
            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-1 z-10"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                {reactions.map((reaction, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className={`transition-colors p-2 ${
                      post.user_reaction === reaction.label
                        ? reaction.color
                        : `hover:${reaction.color}`
                    }`}
                    title={reaction.label}
                    onClick={() => {
                      onReaction(post.id, reaction.label);
                      setShowReactions(false);
                    }}
                  >
                    <reaction.icon className={`h-5 w-5 ${post.user_reaction === reaction.label ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 gap-2 transition-colors ${
              showComments
                ? "bg-primary/10 text-primary"
                : "hover:bg-primary/5 hover:text-primary"
            }`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`hover:bg-primary/5 transition-colors ${
              post.is_saved ? 'text-primary' : 'hover:text-primary'
            }`}
            onClick={() => onSave(post.id)}
          >
            <Bookmark className={`h-4 w-4 ${post.is_saved ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {showComments && (
          <CommentsSection
            postId={post.id}
            initialComments={[]}
          />
        )}
      </div>

      {post.media_url && post.media_type === "image" && (
        <ImageLightbox
          src={post.media_url}
          alt="Post image"
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
};
