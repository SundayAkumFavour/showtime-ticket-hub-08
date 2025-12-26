import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalRevenue: number;
  totalTicketsSold: number;
  activeShows: number;
  soldOutShows: number;
  passedShows: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Fetch orders with completed payment
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, quantity')
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Fetch shows with ticket tiers
      const { data: shows, error: showsError } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          ticket_tiers(id, quantity, sold)
        `);

      if (showsError) throw showsError;

      const now = new Date();
      let activeShows = 0;
      let soldOutShows = 0;
      let passedShows = 0;

      shows?.forEach((show) => {
        const showDate = new Date(show.date);
        const tiers = show.ticket_tiers as { id: string; quantity: number; sold: number }[];
        
        if (showDate < now) {
          passedShows++;
        } else {
          const totalTickets = tiers.reduce((sum, t) => sum + t.quantity, 0);
          const soldTickets = tiers.reduce((sum, t) => sum + t.sold, 0);
          
          if (totalTickets > 0 && soldTickets >= totalTickets) {
            soldOutShows++;
          } else {
            activeShows++;
          }
        }
      });

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const totalTicketsSold = orders?.reduce((sum, o) => sum + o.quantity, 0) || 0;
      const totalOrders = orders?.length || 0;
      const uniqueCustomers = new Set(orders?.map(o => o.user_id) || []).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalTicketsSold,
        activeShows,
        soldOutShows,
        passedShows,
        totalOrders,
        totalCustomers: uniqueCustomers,
        avgOrderValue,
      };
    },
  });
};

export const useRevenueByShow = () => {
  return useQuery({
    queryKey: ['revenue-by-show'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          quantity,
          show_id,
          show:shows(id, title, date)
        `)
        .eq('payment_status', 'completed');

      if (error) throw error;

      // Group by show
      const revenueMap: Record<string, { 
        showId: string; 
        title: string; 
        date: string;
        revenue: number; 
        tickets: number; 
        orders: number;
      }> = {};

      data?.forEach((order) => {
        const show = order.show as { id: string; title: string; date: string } | null;
        if (!show) return;

        if (!revenueMap[show.id]) {
          revenueMap[show.id] = {
            showId: show.id,
            title: show.title,
            date: show.date,
            revenue: 0,
            tickets: 0,
            orders: 0,
          };
        }

        revenueMap[show.id].revenue += Number(order.total_amount);
        revenueMap[show.id].tickets += order.quantity;
        revenueMap[show.id].orders += 1;
      });

      return Object.values(revenueMap).sort((a, b) => b.revenue - a.revenue);
    },
  });
};

export const useOrdersWithDetails = () => {
  return useQuery({
    queryKey: ['admin-orders-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          show:shows(id, title, date, venue),
          ticket_tier:ticket_tiers(id, name, price),
          promo_code:promo_codes(id, code, discount_type, discount_value)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useDailyRevenue = (days: number = 30) => {
  return useQuery({
    queryKey: ['daily-revenue', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, quantity')
        .eq('payment_status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by day
      const dailyMap: Record<string, { date: string; revenue: number; tickets: number; orders: number }> = {};

      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        dailyMap[dateStr] = { date: dateStr, revenue: 0, tickets: 0, orders: 0 };
      }

      data?.forEach((order) => {
        const dateStr = order.created_at.split('T')[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].revenue += Number(order.total_amount);
          dailyMap[dateStr].tickets += order.quantity;
          dailyMap[dateStr].orders += 1;
        }
      });

      return Object.values(dailyMap);
    },
  });
};
