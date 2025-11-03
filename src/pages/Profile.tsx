import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, Award, Bookmark, GraduationCap, Settings, Loader2, UserPlus, UserMinus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/PostCard";
import { Post } from "@/hooks/useFeed";
import { FollowersDialog } from "@/components/FollowersDialog";
import { ImageLightbox } from "@/components/ImageLightbox";

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: currentUserProfile, getProfile, checkIfFollowing, followUser, unfollowUser, getFollowersCount, getFollowingCount } = useProfile();
  const [displayProfile, setDisplayProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("grid");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followersDialogTab, setFollowersDialogTab] = useState<"followers" | "following">("followers");
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);
  const [coverLightboxOpen, setCoverLightboxOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });

  const isOwnProfile = displayProfile?.id === user?.id;

  useEffect(() => {
    if (username) {
      loadProfileData();
    }
  }, [username]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;
      if (!profileData) {
        navigate("/404");
        return;
      }

      setDisplayProfile(profileData);

      if (profileData.id !== user?.id) {
        const { isFollowing: following } = await checkIfFollowing(profileData.id);
        setIsFollowing(following);
      }

      await loadUserPosts(profileData.id);
      if (profileData.id === user?.id) {
        await loadSavedPosts();
      }
      await loadStats(profileData.id);
    } catch (error) {
      console.error("Error loading profile:", error);
      navigate("/404");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!displayProfile) return;

    if (isFollowing) {
      await unfollowUser(displayProfile.id);
      setIsFollowing(false);
      setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
    } else {
      await followUser(displayProfile.id);
      setIsFollowing(true);
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
  };

  const loadUserPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
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
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [reactionsResult, commentsResult] = await Promise.all([
            supabase
              .from("reactions")
              .select("id", { count: "exact" })
              .eq("post_id", post.id),
            supabase
              .from("comments")
              .select("id", { count: "exact" })
              .eq("post_id", post.id),
          ]);

          return {
            ...post,
            reactions_count: reactionsResult.count || 0,
            comments_count: commentsResult.count || 0,
          };
        })
      );

      setUserPosts(postsWithCounts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadSavedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_posts")
        .select(`
          post_id,
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
        .eq("user_id", user?.id);

      if (error) throw error;

      const posts = data?.map((item: any) => item.posts).filter(Boolean) || [];
      setSavedPosts(posts);
    } catch (error) {
      console.error("Error loading saved posts:", error);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      const [postsResult, followersResult, followingResult] = await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact" })
          .eq("user_id", userId),
        supabase
          .from("followers")
          .select("id", { count: "exact" })
          .eq("following_id", userId),
        supabase
          .from("followers")
          .select("id", { count: "exact" })
          .eq("follower_id", userId),
      ]);

      setStats({
        posts: postsResult.count || 0,
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container mx-auto px-4 pt-20 pb-24 max-w-2xl">
          <div className="bg-card rounded-3xl p-8 border border-border shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <Skeleton className="h-28 w-28 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!displayProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <div className="container mx-auto px-0 md:px-4 pt-20 pb-24 max-w-2xl">
        <div className="bg-card rounded-t-3xl p-8 border border-border shadow-lg">
          {displayProfile?.cover_url && (
            <div
              className="w-full h-48 -mt-8 -mx-8 mb-6 rounded-t-3xl bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundImage: `url(${displayProfile.cover_url})` }}
              onClick={() => setCoverLightboxOpen(true)}
            />
          )}

          <div className="flex items-start justify-between mb-6">
            <div className="relative">
              <Avatar
                className="w-28 h-28 border-4 border-primary/20 shadow-xl ring-4 ring-primary/10 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => displayProfile?.avatar_url && setAvatarLightboxOpen(true)}
              >
                <AvatarImage src={displayProfile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
                  {displayProfile?.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                className="shadow-sm gap-2"
                onClick={() => setEditDialogOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Editar perfil
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="shadow-sm gap-2"
                onClick={handleFollowToggle}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Dejar de seguir
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex justify-around py-6 my-6 border-y border-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{stats.posts}</div>
              <div className="text-sm text-muted-foreground font-medium">Posts</div>
            </div>
            <div className="w-px bg-border"></div>
            <div
              className="text-center cursor-pointer hover:bg-muted/50 px-4 py-2 rounded-lg transition-colors"
              onClick={() => {
                setFollowersDialogTab("followers");
                setFollowersDialogOpen(true);
              }}
            >
              <div className="text-3xl font-bold text-foreground mb-1">{stats.followers}</div>
              <div className="text-sm text-muted-foreground font-medium">Seguidores</div>
            </div>
            <div className="w-px bg-border"></div>
            <div
              className="text-center cursor-pointer hover:bg-muted/50 px-4 py-2 rounded-lg transition-colors"
              onClick={() => {
                setFollowersDialogTab("following");
                setFollowersDialogOpen(true);
              }}
            >
              <div className="text-3xl font-bold text-foreground mb-1">{stats.following}</div>
              <div className="text-sm text-muted-foreground font-medium">Seguidos</div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{displayProfile?.username}</h2>
            {displayProfile?.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{displayProfile.bio}</p>
            )}
          </div>
        </div>

        {(displayProfile?.institution_name || displayProfile?.career) && (
          <Card className="mt-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Información Académica</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayProfile.institution_name && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {displayProfile.institution_name}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {displayProfile.career && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Carrera</p>
                    <p className="text-sm font-medium text-foreground">{displayProfile.career}</p>
                  </div>
                )}
                {displayProfile.semester && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Semestre</p>
                    <p className="text-sm font-medium text-foreground">{displayProfile.semester}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="w-full bg-card border-x border-border rounded-none h-16 p-0 shadow-sm">
            <TabsTrigger
              value="grid"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <Grid3x3 className="w-6 h-6" />
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="saved"
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-muted-foreground data-[state=active]:text-primary transition-all"
              >
                <Bookmark className="w-6 h-6" />
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="grid" className="mt-0 bg-card rounded-b-3xl border-x border-b border-border shadow-lg">
            {loadingPosts ? (
              <div className="p-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : userPosts.length > 0 ? (
              <div className="divide-y divide-border">
                {userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReaction={() => {}}
                    onSave={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <Grid3x3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No has publicado nada aún</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comparte tu primera publicación con la comunidad
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0 bg-card rounded-b-3xl border-x border-b border-border shadow-lg">
            {savedPosts.length > 0 ? (
              <div className="divide-y divide-border">
                {savedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReaction={() => {}}
                    onSave={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No tienes publicaciones guardadas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
      <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />

      {displayProfile && (
        <FollowersDialog
          open={followersDialogOpen}
          onOpenChange={setFollowersDialogOpen}
          userId={displayProfile.id}
          initialTab={followersDialogTab}
        />
      )}

      {displayProfile?.avatar_url && (
        <ImageLightbox
          src={displayProfile.avatar_url}
          alt={`${displayProfile.username} avatar`}
          open={avatarLightboxOpen}
          onOpenChange={setAvatarLightboxOpen}
        />
      )}

      {displayProfile?.cover_url && (
        <ImageLightbox
          src={displayProfile.cover_url}
          alt={`${displayProfile.username} cover`}
          open={coverLightboxOpen}
          onOpenChange={setCoverLightboxOpen}
        />
      )}
    </div>
  );
};

export default Profile;
