import { useState, useRef, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, ArrowLeft, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, useMessages } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { conversations, isLoading: conversationsLoading } = useConversations();
  const { messages, isLoading: messagesLoading, sendMessage, isSending, markAsRead } = useMessages(selectedConversationId);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const otherParticipant = selectedConversation?.participants?.find(p => p.user_id !== user?.id);
  const isGroupChat = selectedConversation?.is_group_chat;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversationId && messages.length > 0) {
      markAsRead();
    }
  }, [selectedConversationId, messages, markAsRead]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !imageFile) return;

    let imageUrl: string | undefined;

    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('messages')
          .upload(fileName, imageFile);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Error al subir la imagen');
        return;
      }
    }

    sendMessage({ content: inputMessage || '📷', imageUrl });
    setInputMessage("");
    setImageFile(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedConversationId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />

        <main className="flex-1 pb-16 pt-16">
          <div className="max-w-4xl mx-auto w-full p-4">
            <h1 className="text-2xl font-bold mb-6">Mensajes</h1>

            {conversationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tienes conversaciones aún</p>
                <p className="text-sm text-muted-foreground mt-2">Busca usuarios y envíales un mensaje</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const otherUser = conv.participants?.find(p => p.user_id !== user?.id);
                  const displayName = conv.is_group_chat ? conv.group_name : otherUser?.user?.full_name;
                  const displayAvatar = conv.is_group_chat ? conv.group_avatar : otherUser?.user?.avatar_url;
                  const displaySubtext = conv.is_group_chat
                    ? `${conv.member_count} miembros • ${conv.participants?.length || 0} en línea`
                    : `@${otherUser?.user?.username || ''}`;

                  return (
                    <Card
                      key={conv.id}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setSelectedConversationId(conv.id)}
                    >
                      <div className="flex gap-3">
                        <div className="relative">
                          <Avatar className={`${conv.is_group_chat ? 'h-14 w-14' : 'h-12 w-12'}`}>
                            <AvatarImage src={displayAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              {displayName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {conv.is_group_chat && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-background">
                              {conv.member_count}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold truncate">{displayName}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(conv.last_message_at), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{displaySubtext}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message_preview || 'Sin mensajes aún'}
                            </p>
                            {conv.unread_count! > 0 && (
                              <Badge className="bg-primary text-white">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      
      <main className="flex-1 flex flex-col pb-16 pt-16">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <Card className="border-x-0 border-t-0 rounded-none bg-card/95 backdrop-blur-md sticky top-16 z-30 flex-shrink-0">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedConversationId(null)}
                  className="h-10 w-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={isGroupChat ? selectedConversation?.group_avatar : otherParticipant?.user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {isGroupChat ? selectedConversation?.group_name?.[0] : otherParticipant?.user?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">
                    {isGroupChat ? selectedConversation?.group_name : otherParticipant?.user?.full_name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isGroupChat
                      ? `${selectedConversation?.member_count} miembros`
                      : `@${otherParticipant?.user?.username}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          <ScrollArea className="flex-1 p-3">
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-16 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.sender?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                            {message.sender?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                        {isGroupChat && !isCurrentUser && (
                          <p className="text-xs font-semibold text-foreground mb-1 px-1">
                            {message.sender?.full_name || message.sender?.username}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isCurrentUser
                              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-br-sm shadow-md'
                              : 'bg-card border border-border rounded-bl-sm'
                          }`}
                        >
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Message attachment"
                              className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.image_url, '_blank')}
                            />
                          )}
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <Card className="border-x-0 border-b-0 rounded-none bg-card/95 backdrop-blur-md flex-shrink-0">
            <div className="p-3 border-t border-border">
              {imageFile && (
                <div className="mb-2 p-2 bg-secondary rounded-lg flex items-center gap-2">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <span className="text-sm flex-1">{imageFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageFile(null)}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>

                <div className="flex-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="rounded-full border-border bg-secondary/50 focus:bg-background transition-colors"
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !imageFile) || isSending}
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Messages;