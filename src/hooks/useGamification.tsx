import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface UserStats {
  social_score: number;
  level: number;
  total_hearts: number;
  hearts_given_today: number;
  hearts_received_today: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('social_score, level, total_hearts, current_streak, longest_streak, last_active_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const { data: socialScore } = await supabase.rpc('calculate_social_score', {
        p_user_id: user.id,
      });

      const { data: heartsLimit } = await supabase.rpc('get_hearts_limit', {
        p_user_id: user.id,
      });

      return {
        ...data,
        social_score: socialScore || 0,
        hearts_limit: heartsLimit || 10,
        hearts_given_today: 0,
        hearts_received_today: 0,
      } as UserStats;
    },
    enabled: !!user?.id,
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
    },
  });

  const claimDailyBonusMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('award_daily_login_bonus', {
        p_user_id: user?.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
    },
  });

  useEffect(() => {
    if (user?.id) {
      updateStreakMutation.mutate();
    }
  }, [user?.id]);

  const getNextLevelProgress = () => {
    if (!stats) return 0;
    const currentLevelXP = stats.level * 100;
    const nextLevelXP = (stats.level + 1) * 100;
    const progress = ((stats.social_score - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getLevelTitle = (level: number): string => {
    if (level < 5) return 'Novato';
    if (level < 10) return 'Aprendiz';
    if (level < 20) return 'Colaborador';
    if (level < 30) return 'Experto';
    if (level < 50) return 'Maestro';
    return 'Leyenda';
  };

  return {
    stats,
    achievements,
    isLoading,
    updateStreak: updateStreakMutation.mutate,
    claimDailyBonus: claimDailyBonusMutation.mutate,
    isClaimingBonus: claimDailyBonusMutation.isPending,
    getNextLevelProgress,
    getLevelTitle,
  };
}
