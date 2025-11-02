import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Ban,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc('has_role', {
        p_user_id: user.id,
        p_role: 'admin',
      });

      if (error) throw error;
      return data || false;
    },
    enabled: !!user?.id,
  });

  const { data: reports } = useQuery({
    queryKey: ['reports', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_reports')
        .select(`
          *,
          post:posts(
            id,
            content,
            author:profiles(full_name, username, avatar_url)
          ),
          reporter:profiles!post_reports_reporter_id_fkey(full_name, username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersCount, postsCount, reportsCount, activeUsers] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase
          .from('post_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_active_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        pendingReports: reportsCount.count || 0,
        activeUsers: activeUsers.count || 0,
      };
    },
    enabled: isAdmin,
  });

  const reviewReportMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('post_reports')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(action === 'approved' ? 'Reporte aprobado' : 'Reporte rechazado');
      setSelectedReport(null);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Post eliminado correctamente');
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: user?.id,
        reason,
        banned_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Usuario bloqueado temporalmente');
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder al panel de administración
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <main className="max-w-7xl mx-auto px-4 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona la plataforma y modera contenido</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats?.totalPosts.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reportes Pendientes</p>
                <p className="text-2xl font-bold">{stats?.pendingReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Activos (7d)</p>
                <p className="text-2xl font-bold">{stats?.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="reports">Reportes</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {!reports || reports.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">No hay reportes pendientes</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={report.post?.author?.avatar_url} />
                      <AvatarFallback>
                        {report.post?.author?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {report.post?.author?.full_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            @{report.post?.author?.username}
                          </span>
                          <Badge variant="destructive">{report.reason}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reportado por: {report.reporter?.full_name}
                        </p>
                        <p className="text-sm">{report.post?.content}</p>
                      </div>

                      {report.description && (
                        <div className="p-3 bg-secondary rounded-lg">
                          <p className="text-sm font-medium mb-1">Descripción del reporte:</p>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            reviewReportMutation.mutate({
                              reportId: report.id,
                              action: 'approved',
                            })
                          }
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Eliminar Post
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            reviewReportMutation.mutate({
                              reportId: report.id,
                              action: 'rejected',
                            })
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Rechazar Reporte
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            banUserMutation.mutate({
                              userId: report.post?.author_id,
                              reason: `Reporte: ${report.reason}`,
                            })
                          }
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Bloquear Usuario (30 días)
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Gestión de usuarios en desarrollo</p>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Moderación de contenido en desarrollo</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {selectedReport && (
        <AlertDialog open onOpenChange={() => setSelectedReport(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este post?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El post será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deletePostMutation.mutate(selectedReport.post_id);
                  setSelectedReport(null);
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Admin;
