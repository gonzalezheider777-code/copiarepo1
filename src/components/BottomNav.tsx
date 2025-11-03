import { Home, Search, PlusSquare, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateIdeaForm } from "./CreateIdeaForm";
import { CreateProjectForm } from "./CreateProjectForm";
import { CreateTeamForm } from "./CreateTeamForm";
import { CreateEventForm } from "./CreateEventForm";
import CreateTextPostForm from "./CreateTextPostForm";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const BottomNav = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const profileUsername = profile?.username || user?.id;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        <Button
          variant="ghost"
          size="icon"
          className="flex-col h-auto py-2 gap-1 hover:bg-primary/5 hover:text-primary transition-colors"
          onClick={handleHomeClick}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Inicio</span>
        </Button>
        <Link to="/search">
          <Button
            variant="ghost"
            size="icon"
            className="flex-col h-auto py-2 gap-1 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <Search className="h-6 w-6" />
            <span className="text-xs font-medium">Buscar</span>
          </Button>
        </Link>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-col h-auto py-2 gap-1 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <PlusSquare className="h-6 w-6" />
              <span className="text-xs font-medium">Crear</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear publicación</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="text">📝 Texto</TabsTrigger>
                <TabsTrigger value="idea">💡 Idea</TabsTrigger>
                <TabsTrigger value="proyecto">🚀 Proyecto</TabsTrigger>
                <TabsTrigger value="equipo">👥 Equipo</TabsTrigger>
                <TabsTrigger value="evento">📅 Evento</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <CreateTextPostForm onClose={() => setCreateOpen(false)} />
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
        <Link to="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="flex-col h-auto py-2 gap-1 hover:bg-primary/5 hover:text-primary transition-colors relative"
          >
            <Bell className="h-6 w-6" />
            <span className="text-xs font-medium">Avisos</span>
            <span className="absolute top-1 right-2 h-2 w-2 bg-destructive rounded-full"></span>
          </Button>
        </Link>
        <Link to={`/profile/${profileUsername}`}>
          <Button
            variant="ghost"
            size="icon"
            className="flex-col h-auto py-2 gap-1 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Perfil</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};
