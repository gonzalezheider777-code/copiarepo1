import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  role: string;
  avatar: string;
  followers: number;
  postsCount: number;
  coverImage?: string;
  mutualConnections?: number;
  isFollowing?: boolean;
}

export const SuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppressedUsers, setSuppressedUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSuggestedUsers();
    }
  }, [user]);

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);

      const { data: followingData } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user?.id);

      const followingIds = followingData?.map(f => f.following_id) || [];

      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, cover_url, bio, career, institution_name")
        .neq("id", user?.id)
        .limit(10);

      if (error) throw error;

      const usersWithStats = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const isFollowing = followingIds.includes(profile.id);

          if (isFollowing) return null;

          const [followersResult, postsResult] = await Promise.all([
            supabase
              .from("followers")
              .select("id", { count: "exact" })
              .eq("following_id", profile.id),
            supabase
              .from("posts")
              .select("id", { count: "exact" })
              .eq("user_id", profile.id),
          ]);

          return {
            id: profile.id,
            name: profile.username,
            username: profile.username,
            role: profile.career && profile.institution_name
              ? `${profile.career} • ${profile.institution_name}`
              : profile.career || profile.bio || "Usuario",
            avatar: profile.avatar_url || "",
            followers: followersResult.count || 0,
            postsCount: postsResult.count || 0,
            coverImage: profile.cover_url,
            isFollowing: false,
          };
        })
      );

      const filteredUsers = usersWithStats.filter(Boolean) as SuggestedUser[];
      const sortedUsers = filteredUsers.sort((a, b) => b.followers - a.followers);

      setUsers(sortedUsers.slice(0, 8));
    } catch (error) {
      console.error("Error loading suggested users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, userName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("followers")
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: true } : u));

      toast({
        title: "Usuario seguido",
        description: `Ahora sigues a ${userName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSuppress = (userId: string, userName: string) => {
    setSuppressedUsers(prev => new Set(prev).add(userId));
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "Usuario suprimido",
      description: `${userName} ya no aparecerá en tus sugerencias`,
    });
  };

  const handleSeeMore = () => {
    loadSuggestedUsers();
  };

  if (loading) {
    return (
      <div className="mb-6 bg-card border-y border-border">
        <div className="p-4 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="mb-6 bg-card border-y border-border">
      <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">Tus sugerencias de usuarios</h2>
        </div>
      </div>

      {/* Carrusel horizontal */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex-shrink-0 w-[280px] snap-start"
            >
              <Card className="overflow-hidden border-border hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                {user.coverImage && (
                  <div
                    className="h-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${user.coverImage})` }}
                  />
                )}

                <div className="p-4">
                  {/* Avatar */}
                  <div className={`flex justify-center ${user.coverImage ? '-mt-10' : ''} mb-3`}>
                    <Avatar className="h-16 w-16 border-4 border-background">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* User Info */}
                  <Link to={`/profile/${user.username}`} className="text-center mb-3 block">
                    <h3 className="font-semibold text-foreground text-sm mb-1 hover:underline">
                      {user.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {user.role}
                    </p>
                  </Link>

                  {/* Stats */}
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-muted-foreground text-center">
                      {user.followers} {user.followers === 1 ? 'seguidor' : 'seguidores'}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      {user.postsCount} {user.postsCount === 1 ? 'publicación' : 'publicaciones'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant={user.isFollowing ? "secondary" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleFollow(user.id, user.name)}
                      disabled={user.isFollowing}
                    >
                      {user.isFollowing ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Siguiendo
                        </>
                      ) : (
                        'Seguir'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuppress(user.id, user.name)}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Ver más */}
      <div className="mt-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSeeMore}
          className="text-primary hover:text-primary/80"
        >
          Ver más usuarios →
        </Button>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      </div>
    </div>
  );
};
