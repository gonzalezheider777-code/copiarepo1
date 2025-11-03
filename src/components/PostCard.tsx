import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Lightbulb, Flame, Users, MoreVertical, UserPlus, UserMinus } from "lucide-react";
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
import { Link } from "react-router-dom";
import ReactionsDialog from "./ReactionsDialog";
import IdeaParticipantsDialog from "./IdeaParticipantsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";

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
  const [reactionsDialogOpen, setReactionsDialogOpen] = useState(false);
  const [postReactions, setPostReactions] = useState<any[]>([]);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(post.user_joined || false);
  const [participantsCount, setParticipantsCount] = useState(post.participants_count || 0);
  const { toast } = useToast();
  const { user } = useAuth();
  const { joinIdea, leaveIdea, getIdeaParticipants } = usePosts();

  const isOwnPost = user?.id === post.user_id;

  useEffect(() => {
    if (post.post_type === "idea" && participantsCount > 0 && participants.length === 0) {
      loadParticipantsPreview();
    }
  }, [post.post_type, participantsCount]);

  const loadParticipantsPreview = async () => {
    const { data } = await getIdeaParticipants(post.id);
    if (data) {
      setParticipants(data);
    }
  };

  useEffect(() => {
    if (!videoRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && videoRef) {
            videoRef.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef);

    return () => {
      if (videoRef) {
        observer.unobserve(videoRef);
      }
    };
  }, [videoRef]);

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

  const loadReactions = async () => {
    try {
      setLoadingReactions(true);
      const { data, error } = await supabase
        .from("reactions")
        .select(`
          id,
          reaction_type,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("post_id", post.id);

      if (error) throw error;

      const formattedReactions = (data || []).map((reaction: any) => ({
        userId: reaction.user_id,
        userName: reaction.profiles?.username || "Usuario",
        userAvatar: reaction.profiles?.avatar_url || "",
        type: reaction.reaction_type,
      }));

      setPostReactions(formattedReactions);
    } catch (error) {
      console.error("Error loading reactions:", error);
    } finally {
      setLoadingReactions(false);
    }
  };

  const getPostTypeLabel = () => {
    switch (post.post_type) {
      case "idea": return "Idea";
      case "proyecto": return "Proyecto";
      case "evento": return "Evento";
      case "equipo": return "Equipo";
      default: return null;
    }
  };

  const getPostTypeBadgeStyle = () => {
    switch (post.post_type) {
      case "idea": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0";
      case "proyecto": return "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0";
      case "evento": return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0";
      case "equipo": return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
      default: return "";
    }
  };

  const handleJoinIdea = async () => {
    const { error } = await joinIdea(post.id);
    if (!error) {
      setIsJoined(true);
      setParticipantsCount((prev) => prev + 1);
    }
  };

  const handleLeaveIdea = async () => {
    const { error } = await leaveIdea(post.id);
    if (!error) {
      setIsJoined(false);
      setParticipantsCount((prev) => Math.max(0, prev - 1));
    }
  };

  const loadParticipants = async () => {
    const { data } = await getIdeaParticipants(post.id);
    if (data) {
      setParticipants(data);
      setParticipantsDialogOpen(true);
    }
  };

  return (
    <div className="bg-card border-b border-border transition-all duration-200 hover:bg-card/50">
      <div className="px-4 py-5 max-w-screen-xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <Link to={`/profile/${post.profiles.username}`} className="flex-shrink-0">
            <Avatar className="h-11 w-11 ring-1 ring-border hover:ring-2 hover:ring-primary transition-all cursor-pointer">
              <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.username} />
              <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                {post.profiles.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${post.profiles.username}`}>
              <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 hover:underline cursor-pointer">
                {post.profiles.username}
              </h3>
            </Link>
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
                className={`text-xs font-semibold px-3 py-1 whitespace-nowrap rounded-full shadow-sm ${getPostTypeBadgeStyle()}`}
              >
                {getPostTypeLabel()}
              </Badge>
            )}
            <PostMenu
              postId={post.id}
              isOwnPost={isOwnPost}
              onDelete={onDelete}
            />
          </div>
        </div>

        <div className="space-y-4">
          {post.content && (
            <div className="space-y-2">
              {(() => {
                const lines = post.content.split('\n').filter(l => l.trim());
                const firstLine = lines[0];
                const isTitle = firstLine && firstLine.length < 100 && lines.length > 1;

                return lines.map((line, index) => {
                  if (index === 0 && isTitle) {
                    return (
                      <h3 key={index} className="text-xl font-bold text-foreground leading-tight">
                        {line}
                      </h3>
                    );
                  }
                  return (
                    <p key={index} className="text-sm text-foreground/90 leading-relaxed">
                      {line}
                    </p>
                  );
                });
              })()}
            </div>
          )}

          {post.post_type === "idea" && (
            <div className="space-y-3 pt-2">
              {isJoined ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLeaveIdea}
                  className="w-full gap-2 h-12 font-semibold"
                >
                  <UserMinus className="h-5 w-5" />
                  Salir de la idea
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleJoinIdea}
                  className="w-full gap-2 h-12 font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 shadow-lg"
                >
                  <UserPlus className="h-5 w-5" />
                  Unirse a la idea
                </Button>
              )}
              {participantsCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {participants.slice(0, 5).map((participant, idx) => (
                      <Avatar key={participant.user_id} className="w-8 h-8 border-2 border-background ring-1 ring-border">
                        <AvatarImage src={participant.profiles.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {participant.profiles.username.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <button
                    onClick={loadParticipants}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Users className="h-4 w-4" />
                    {participantsCount === 1 ? "1 participante" : `+${participantsCount} participantes`}
                  </button>
                </div>
              )}
            </div>
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

          {post.media_url && post.media_type === "video" && (
            <div className="rounded overflow-hidden border border-border">
              <video
                ref={setVideoRef}
                src={post.media_url}
                controls
                className="w-full h-auto max-h-96 bg-black"
                preload="metadata"
                poster={post.media_url.replace(/\.(mp4|webm|ogg)$/, '-thumb.jpg')}
                playsInline
                controlsList="nodownload"
              >
                <source src={post.media_url} type="video/mp4" />
                <source src={post.media_url.replace('.mp4', '.webm')} type="video/webm" />
                Tu navegador no soporta el elemento de video.
              </video>
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
              onClick={(e) => {
                if (post.reactions_count && post.reactions_count > 0) {
                  e.stopPropagation();
                  loadReactions();
                  setReactionsDialogOpen(true);
                }
              }}
            >
              <ReactionIcon className={`h-4 w-4 ${post.user_reaction ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium cursor-pointer">{post.reactions_count || 0}</span>
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

      <ReactionsDialog
        open={reactionsDialogOpen}
        onOpenChange={setReactionsDialogOpen}
        reactions={postReactions}
      />

      <IdeaParticipantsDialog
        open={participantsDialogOpen}
        onOpenChange={setParticipantsDialogOpen}
        participants={participants}
      />
    </div>
  );
};
