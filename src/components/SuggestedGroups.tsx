import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  member_count: number;
  is_member: boolean;
}

export const SuggestedGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSuggestedGroups();
    }
  }, [user]);

  const loadSuggestedGroups = async () => {
    try {
      setLoading(true);

      const { data: memberGroupsData } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user?.id);

      const memberGroupIds = memberGroupsData?.map(m => m.group_id) || [];

      const { data: groupsData, error } = await supabase
        .from("groups")
        .select("id, name, description, avatar_url, privacy")
        .eq("privacy", "public")
        .limit(6);

      if (error) throw error;

      const groupsWithStats = await Promise.all(
        (groupsData || []).map(async (group) => {
          const isMember = memberGroupIds.includes(group.id);

          const { count } = await supabase
            .from("group_members")
            .select("id", { count: "exact" })
            .eq("group_id", group.id);

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            avatar_url: group.avatar_url,
            member_count: count || 0,
            is_member: isMember,
          };
        })
      );

      const filteredGroups = groupsWithStats.filter(g => !g.is_member);
      const sortedGroups = filteredGroups.sort((a, b) => b.member_count - a.member_count);

      setGroups(sortedGroups.slice(0, 4));
    } catch (error) {
      console.error("Error loading suggested groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string, groupName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "member",
        });

      if (error) throw error;

      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_member: true, member_count: g.member_count + 1 } : g));

      toast({
        title: "Te uniste al grupo",
        description: `Ahora eres miembro de ${groupName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

  if (groups.length === 0) return null;

  return (
    <div className="mb-6 bg-card border-y border-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Grupos Sugeridos</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {group.avatar_url ? (
                  <img
                    src={group.avatar_url}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
                  </span>
                  <Button
                    size="sm"
                    variant={group.is_member ? "secondary" : "ghost"}
                    className="h-7 px-2 text-primary"
                    onClick={() => handleJoinGroup(group.id, group.name)}
                    disabled={group.is_member}
                  >
                    {group.is_member ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Miembro
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Unirse
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
