import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FollowUser {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  isFollowing?: boolean;
}

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialTab?: "followers" | "following";
}

export const FollowersDialog = ({ open, onOpenChange, userId, initialTab = "followers" }: FollowersDialogProps) => {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFollowers();
      loadFollowing();
    }
  }, [open, userId]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("followers")
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq("following_id", userId);

      if (error) throw error;

      const followerUsers = await Promise.all(
        (data || []).map(async (item: any) => {
          const isFollowing = user ? await checkIfFollowing(item.profiles.id) : false;
          return {
            id: item.profiles.id,
            username: item.profiles.username,
            avatar_url: item.profiles.avatar_url,
            bio: item.profiles.bio,
            isFollowing,
          };
        })
      );

      setFollowers(followerUsers);
    } catch (error) {
      console.error("Error loading followers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select(`
          following_id,
          profiles:following_id (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;

      const followingUsers = (data || []).map((item: any) => ({
        id: item.profiles.id,
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        bio: item.profiles.bio,
        isFollowing: true,
      }));

      setFollowing(followingUsers);
    } catch (error) {
      console.error("Error loading following:", error);
    }
  };

  const checkIfFollowing = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();

    return !!data;
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("followers")
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) throw error;

      setFollowers(prev =>
        prev.map(f => f.id === targetUserId ? { ...f, isFollowing: true } : f)
      );

      toast({ title: "Ahora sigues a este usuario" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;

      setFollowers(prev =>
        prev.map(f => f.id === targetUserId ? { ...f, isFollowing: false } : f)
      );
      setFollowing(prev => prev.filter(f => f.id !== targetUserId));

      toast({ title: "Dejaste de seguir a este usuario" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filterUsers = (users: FollowUser[]) => {
    if (!searchQuery) return users;
    return users.filter(u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const UserItem = ({ user: followUser }: { user: FollowUser }) => (
    <div className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg transition-colors">
      <Link to={`/profile/${followUser.username}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onOpenChange(false)}>
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={followUser.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {followUser.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{followUser.username}</p>
          {followUser.bio && (
            <p className="text-sm text-muted-foreground truncate">{followUser.bio}</p>
          )}
        </div>
      </Link>
      {user && followUser.id !== user.id && (
        <Button
          size="sm"
          variant={followUser.isFollowing ? "outline" : "default"}
          onClick={() => followUser.isFollowing ? handleUnfollow(followUser.id) : handleFollow(followUser.id)}
          className="ml-2 flex-shrink-0"
        >
          {followUser.isFollowing ? (
            <>
              <UserMinus className="h-4 w-4 mr-1" />
              Siguiendo
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Seguir
            </>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Conexiones</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue={initialTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="followers">
              Seguidores ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Seguidos ({following.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="followers" className="mt-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filterUsers(followers).length > 0 ? (
                <div className="space-y-2">
                  {filterUsers(followers).map((follower) => (
                    <UserItem key={follower.id} user={follower} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No se encontraron usuarios" : "Aún no hay seguidores"}
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filterUsers(following).length > 0 ? (
                <div className="space-y-2">
                  {filterUsers(following).map((followedUser) => (
                    <UserItem key={followedUser.id} user={followedUser} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No se encontraron usuarios" : "Aún no sigue a nadie"}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
