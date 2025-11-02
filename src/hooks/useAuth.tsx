import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (event === 'SIGNED_IN') {
              logger.info('User signed in', { userId: session?.user?.id });
            } else if (event === 'SIGNED_OUT') {
              logger.info('User signed out');
            }
          }
        );

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        return () => subscription?.unsubscribe();
      } catch (error) {
        logger.error('Auth setup failed', error);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signUp = async (email: string, password: string, userData: {
    username: string;
    career?: string;
    semester?: string;
    institution_name?: string;
    academic_role?: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData,
        },
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            username: userData.username,
            career: userData.career,
            semester: userData.semester,
            institution_name: userData.institution_name,
            academic_role: userData.academic_role,
          });

        if (profileError) throw profileError;
      }

      toast({
        title: "Cuenta creada",
        description: "Tu cuenta ha sido creada exitosamente",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      logger.info('User signed out successfully');
    } catch (error: any) {
      logger.error('Sign out failed', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Correo enviado",
        description: "Revisa tu correo para restablecer tu contraseña",
      });
      logger.info('Password reset email sent', { email });
      return { error: null };
    } catch (error: any) {
      logger.error('Password reset failed', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsResettingPassword(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
      });
      logger.info('Password updated successfully');
      return { error: null };
    } catch (error: any) {
      logger.error('Password update failed', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    isResettingPassword,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };
};
