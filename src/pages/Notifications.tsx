import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, UserPlus, Users, ThumbsUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  message: string;
  post_id?: string;
  comment_id?: string;
  read: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url?: string;
  };
  post?: {
    content: string;
  };
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotifications();

      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          sender:sender_id (
            username,
            avatar_url
          ),
          post:post_id (
            content
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
      case "reaction":
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "join":
      case "idea_join":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "mention":
        return <ThumbsUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-primary" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = (notification: Notification) => {
    const postPreview = notification.post?.content
      ? notification.post.content.substring(0, 50) + (notification.post.content.length > 50 ? "..." : "")
      : null;

    return (
      <Card
        key={notification.id}
        className={`p-4 transition-all cursor-pointer border-border hover:shadow-[var(--shadow-hover)] ${
          !notification.read ? "bg-primary/5 border-l-4 border-l-primary" : ""
        }`}
        style={{ boxShadow: "var(--shadow-card)" }}
        onClick={() => {
          if (!notification.read) {
            markAsRead(notification.id);
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <Link to={notification.sender ? `/profile/${notification.sender.username}` : "#"}>
              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarImage src={notification.sender?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                  {notification.sender?.username?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card rounded-full flex items-center justify-center border-2 border-card shadow-md">
              {getNotificationIcon(notification.type)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              {notification.sender && (
                <Link to={`/profile/${notification.sender.username}`}>
                  <span className="font-semibold text-foreground hover:underline">
                    {notification.sender.username}
                  </span>
                </Link>
              )}{" "}
              <span className="text-muted-foreground">{notification.message}</span>
            </p>
            {postPreview && (
              <p className="text-sm text-primary/80 mt-1 truncate">
                "{postPreview}"
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
          {!notification.read && (
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <main className="max-w-screen-xl mx-auto px-0 md:px-4 pt-4">
        <div className="flex items-center justify-between mb-6 px-4 md:px-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Tienes {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} nueva{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 px-3 py-1">
              {unreadCount} nuevas
            </Badge>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full px-4 md:px-0">
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-card border border-border h-12">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              Todas
            </TabsTrigger>
            <TabsTrigger value="likes" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <Heart className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <MessageSquare className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <Users className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => renderNotification(notification))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tienes notificaciones</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="space-y-2">
            {notifications.filter((n) => n.type === "like" || n.type === "reaction").length > 0 ? (
              notifications
                .filter((n) => n.type === "like" || n.type === "reaction")
                .map((notification) => renderNotification(notification))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tienes notificaciones de reacciones</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-2">
            {notifications.filter((n) => n.type === "comment" || n.type === "mention").length > 0 ? (
              notifications
                .filter((n) => n.type === "comment" || n.type === "mention")
                .map((notification) => renderNotification(notification))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tienes notificaciones de comentarios</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-2">
            {notifications.filter((n) => n.type === "follow" || n.type === "join" || n.type === "idea_join").length > 0 ? (
              notifications
                .filter((n) => n.type === "follow" || n.type === "join" || n.type === "idea_join")
                .map((notification) => renderNotification(notification))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tienes notificaciones de personas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
