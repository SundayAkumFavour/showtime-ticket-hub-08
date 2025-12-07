import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  user_id: string;
  show_id: string;
  ticket_tier_id: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  reference: string;
  created_at: string;
  show?: {
    id: string;
    title: string;
    image: string | null;
    venue: string;
    location: string;
    date: string;
    time: string;
  };
  ticket_tier?: {
    id: string;
    name: string;
    price: number;
  };
}

export const useUserOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async (): Promise<Order[]> => {
      if (!userId) return [];

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          show:shows(id, title, image, venue, location, date, time),
          ticket_tier:ticket_tiers(id, name, price)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders || [];
    },
    enabled: !!userId,
  });
};

export const useAllOrders = () => {
  return useQuery({
    queryKey: ['all-orders'],
    queryFn: async (): Promise<Order[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          show:shows(id, title, image, venue, location, date, time),
          ticket_tier:ticket_tiers(id, name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders || [];
    },
  });
};
