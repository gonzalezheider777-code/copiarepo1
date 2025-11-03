import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateIdeaForm } from "./CreateIdeaForm";
import { CreateProjectForm } from "./CreateProjectForm";
import { CreateTeamForm } from "./CreateTeamForm";
import { CreateEventForm } from "./CreateEventForm";
import CreateTextPostForm from "./CreateTextPostForm";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface CreatePostPromptProps {
  onPostCreated?: () => void;
}

export const CreatePostPrompt = ({ onPostCreated }: CreatePostPromptProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Usuario';
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="mb-6 bg-card border-y border-border">
      <div className="p-5">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer group">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-secondary hover:bg-secondary/80 px-5 py-3.5 rounded-full transition-all duration-200 border border-border group-hover:border-primary/20 group-hover:shadow-sm">
              <p className="text-sm text-muted-foreground font-medium">¿Qué idea tienes en mente?</p>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Crear publicación</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="text" className="w-full">
            <div className="space-y-2 mb-6">
              <TabsList className="grid w-full grid-cols-3 gap-2 h-auto bg-transparent p-0">
                <TabsTrigger value="text" className="flex flex-col items-center gap-2 px-4 py-3.5 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/50 border-2 border-transparent rounded-lg transition-all hover:border-primary/30">
                  <span className="text-2xl">📝</span>
                  <span className="text-sm font-medium">Texto</span>
                </TabsTrigger>
                <TabsTrigger value="idea" className="flex flex-col items-center gap-2 px-4 py-3.5 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/50 border-2 border-transparent rounded-lg transition-all hover:border-primary/30">
                  <span className="text-2xl">💡</span>
                  <span className="text-sm font-medium">Idea</span>
                </TabsTrigger>
                <TabsTrigger value="proyecto" className="flex flex-col items-center gap-2 px-4 py-3.5 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/50 border-2 border-transparent rounded-lg transition-all hover:border-primary/30">
                  <span className="text-2xl">🚀</span>
                  <span className="text-sm font-medium">Proyecto</span>
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-2 gap-2 h-auto bg-transparent p-0">
                <TabsTrigger value="equipo" className="flex flex-col items-center gap-2 px-4 py-3.5 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/50 border-2 border-transparent rounded-lg transition-all hover:border-primary/30">
                  <span className="text-2xl">👥</span>
                  <span className="text-sm font-medium">Equipo</span>
                </TabsTrigger>
                <TabsTrigger value="evento" className="flex flex-col items-center gap-2 px-4 py-3.5 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/50 border-2 border-transparent rounded-lg transition-all hover:border-primary/30">
                  <span className="text-2xl">📅</span>
                  <span className="text-sm font-medium">Evento</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="text">
              <CreateTextPostForm
                onClose={() => setOpen(false)}
                onPostCreated={onPostCreated}
              />
            </TabsContent>
            <TabsContent value="idea">
              <CreateIdeaForm />
            </TabsContent>
            <TabsContent value="proyecto">
              <CreateProjectForm />
            </TabsContent>
            <TabsContent value="equipo">
              <CreateTeamForm />
            </TabsContent>
            <TabsContent value="evento">
              <CreateEventForm />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};
