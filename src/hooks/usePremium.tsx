import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
}

export interface PremiumFeatures {
  canCreateGroups: boolean;
  groupLimit: number;
  canUploadLargeFiles: boolean;
  maxFileSize: number;
  canUseAdvancedAnalytics: boolean;
  canCustomizeProfile: boolean;
  adFree: boolean;
  prioritySupport: boolean;
  customBadge: boolean;
  heartsBonus: number;
}

export function usePremium() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Subscription;
    },
    enabled: !!user?.id,
  });

  const { data: isPremium } = useQuery({
    queryKey: ['is-premium', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc('is_premium_user', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || false;
    },
    enabled: !!user?.id,
  });

  const validatePromoCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code,
      });

      if (error) throw error;
      return data;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async ({
      amount,
      currency,
      plan,
    }: {
      amount: number;
      currency: string;
      plan: string;
    }) => {
      const { data, error } = await supabase.from('payments').insert({
        user_id: user?.id,
        amount,
        currency,
        plan,
        status: 'pending',
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      plan,
      durationMonths,
    }: {
      paymentId: string;
      plan: string;
      durationMonths: number;
    }) => {
      const { error } = await supabase.rpc('confirm_payment_and_activate_subscription', {
        p_payment_id: paymentId,
        p_plan: plan,
        p_duration_months: durationMonths,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-premium', user?.id] });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error('No subscription found');

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', auto_renew: false })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-premium', user?.id] });
    },
  });

  const getPremiumFeatures = (): PremiumFeatures => {
    const plan = subscription?.plan || 'free';

    const features: Record<string, PremiumFeatures> = {
      free: {
        canCreateGroups: true,
        groupLimit: 3,
        canUploadLargeFiles: false,
        maxFileSize: 5,
        canUseAdvancedAnalytics: false,
        canCustomizeProfile: false,
        adFree: false,
        prioritySupport: false,
        customBadge: false,
        heartsBonus: 0,
      },
      premium: {
        canCreateGroups: true,
        groupLimit: 10,
        canUploadLargeFiles: true,
        maxFileSize: 20,
        canUseAdvancedAnalytics: true,
        canCustomizeProfile: true,
        adFree: true,
        prioritySupport: false,
        customBadge: true,
        heartsBonus: 5,
      },
      pro: {
        canCreateGroups: true,
        groupLimit: -1,
        canUploadLargeFiles: true,
        maxFileSize: 100,
        canUseAdvancedAnalytics: true,
        canCustomizeProfile: true,
        adFree: true,
        prioritySupport: true,
        customBadge: true,
        heartsBonus: 15,
      },
    };

    return features[plan];
  };

  return {
    subscription,
    isPremium: isPremium || false,
    isLoading,
    features: getPremiumFeatures(),
    validatePromoCode: validatePromoCodeMutation.mutate,
    createPayment: createPaymentMutation.mutate,
    confirmPayment: confirmPaymentMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isValidating: validatePromoCodeMutation.isPending,
    isProcessingPayment: createPaymentMutation.isPending || confirmPaymentMutation.isPending,
  };
}
