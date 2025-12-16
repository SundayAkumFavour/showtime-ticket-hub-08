import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  show_id: string | null;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePromoCodes = () => {
  return useQuery({
    queryKey: ['promo_codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });
};

export const useValidatePromoCode = () => {
  return useMutation({
    mutationFn: async ({ 
      code, 
      showId, 
      amount 
    }: { 
      code: string; 
      showId: string; 
      amount: number;
    }): Promise<PromoCode> => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Invalid promo code');

      const promo = data as PromoCode;
      const now = new Date();

      // Check validity period
      if (new Date(promo.valid_from) > now) {
        throw new Error('This promo code is not yet active');
      }
      if (promo.valid_until && new Date(promo.valid_until) < now) {
        throw new Error('This promo code has expired');
      }

      // Check max uses
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        throw new Error('This promo code has reached its usage limit');
      }

      // Check show restriction
      if (promo.show_id && promo.show_id !== showId) {
        throw new Error('This promo code is not valid for this show');
      }

      // Check minimum purchase
      if (amount < promo.min_purchase_amount) {
        throw new Error(`Minimum purchase of ₦${promo.min_purchase_amount.toLocaleString()} required`);
      }

      return promo;
    },
  });
};

export const useCreatePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PromoCode, 'id' | 'current_uses' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('promo_codes')
        .insert({
          ...data,
          code: data.code.toUpperCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo_codes'] });
      toast.success('Promo code created successfully');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('A promo code with this code already exists');
      } else {
        toast.error(error.message || 'Failed to create promo code');
      }
    },
  });
};

export const useUpdatePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PromoCode> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('promo_codes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo_codes'] });
      toast.success('Promo code updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update promo code');
    },
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo_codes'] });
      toast.success('Promo code deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete promo code');
    },
  });
};

export const calculateDiscount = (promo: PromoCode, amount: number): number => {
  if (promo.discount_type === 'percentage') {
    return Math.round(amount * (promo.discount_value / 100));
  }
  return Math.min(promo.discount_value, amount);
};
