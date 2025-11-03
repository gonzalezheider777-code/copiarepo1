import { useState, useEffect } from "react";
import { MessageSquare, Menu, Settings, User, Bell, HelpCircle, LogOut, Shield, Palette, Globe, Users, Bookmark, Info, AlertCircle, Mail, Home, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

export const TopBar = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Usuario';
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="sticky top-0 bg-card border-b border-border z-40 w-full">
      <div className="flex items-center justify-between h-14 px-4">
        <a href="/" onClick={handleLogoClick} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-base">UC</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground">UniConnect</h1>
          </div>
        </a>
        
        <div className="flex items-center gap-2">
          <Link to="/messages">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted transition-colors relative h-9 w-9"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full"></span>
            </Button>
          </Link>

          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted transition-colors h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-card border-border max-h-[95vh] flex flex-col">
              <DrawerHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg font-semibold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <DrawerTitle className="text-xl">{displayName}</DrawerTitle>
                    <DrawerDescription className="text-sm">@{profile?.username || 'usuario'}</DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Inicio */}
                <Link to="/" onClick={() => setOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start h-auto py-4 px-4 hover:bg-primary/10 ${
                      location.pathname === "/" ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    <Home className="mr-3 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-base">Inicio</span>
                      <span className="text-xs text-muted-foreground">Ver publicaciones y actividad</span>
                    </div>
                  </Button>
                </Link>

                {/* Mi Perfil */}
                <Link to={`/profile/${profile?.username || user?.id}`} onClick={() => setOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start h-auto py-4 px-4 hover:bg-primary/10 ${
                      location.pathname.includes("/profile") ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    <User className="mr-3 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-base">Mi Perfil</span>
                      <span className="text-xs text-muted-foreground">Ver y editar perfil completo</span>
                    </div>
                  </Button>
                </Link>

                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <Users className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Mis Conexiones</span>
                    <span className="text-xs text-muted-foreground">1.2K seguidores · 324 seguidos</span>
                  </div>
                </Button>

                <Link to="/messages" onClick={() => setOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start h-auto py-4 px-4 hover:bg-primary/10 ${
                      location.pathname === "/messages" ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    <MessageSquare className="mr-3 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-base">Mensajes</span>
                      <span className="text-xs text-muted-foreground">Chats y grupos</span>
                    </div>
                  </Button>
                </Link>

                <Link to="/notifications" onClick={() => setOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start h-auto py-4 px-4 hover:bg-primary/10 ${
                      location.pathname === "/notifications" ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    <Bell className="mr-3 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-base">Notificaciones</span>
                      <span className="text-xs text-muted-foreground">Gestionar avisos y alertas</span>
                    </div>
                  </Button>
                </Link>

                <Link to="/saved" onClick={() => setOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-auto py-4 px-4 hover:bg-primary/10 ${
                      location.pathname === "/saved" ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    <Bookmark className="mr-3 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-base">Guardados</span>
                      <span className="text-xs text-muted-foreground">Publicaciones guardadas</span>
                    </div>
                  </Button>
                </Link>

                <Separator className="my-2" />

                {/* Configuración */}
                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <Settings className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Configuración y Privacidad</span>
                    <span className="text-xs text-muted-foreground">Ajustes de cuenta</span>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <Sun className="mr-3 h-5 w-5 text-primary" /> : <Moon className="mr-3 h-5 w-5 text-primary" />}
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Apariencia</span>
                    <span className="text-xs text-muted-foreground">{darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}</span>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <Shield className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Seguridad</span>
                    <span className="text-xs text-muted-foreground">Contraseña y verificación</span>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <Globe className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Idioma</span>
                    <span className="text-xs text-muted-foreground">Español</span>
                  </div>
                </Button>

                <Separator className="my-2" />

                {/* Ayuda */}
                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <HelpCircle className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Ayuda y Soporte</span>
                    <span className="text-xs text-muted-foreground">Centro de ayuda, reportar problemas</span>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <AlertCircle className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Reportar Problema</span>
                    <span className="text-xs text-muted-foreground">Enviar feedback</span>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/10">
                  <Info className="mr-3 h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">Acerca de</span>
                    <span className="text-xs text-muted-foreground">Versión 1.0.0</span>
                  </div>
                </Button>

                <Separator className="my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-4 px-4 hover:bg-destructive/10 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="font-semibold text-base">Cerrar Sesión</span>
                </Button>
              </div>

              <DrawerFooter className="border-t border-border">
                <DrawerClose asChild>
                  <Button variant="outline">Cerrar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          
          <Link to={`/profile/${profile?.username || user?.id}`}>
            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};
