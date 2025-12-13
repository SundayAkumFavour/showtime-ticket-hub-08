import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Seat {
  id: string;
  show_id: string;
  layout_id: string | null;
  row_label: string;
  seat_number: number;
  tier_id: string | null;
  status: 'available' | 'reserved' | 'sold';
  order_id: string | null;
  created_at: string;
}

export interface VenueLayout {
  id: string;
  name: string;
  venue_name: string;
  rows_config: RowConfig[];
  created_at: string;
  updated_at: string;
}

export interface RowConfig {
  label: string;
  seats: number;
  curve_offset?: number;
  tier_id?: string;
}

export const useVenueLayouts = () => {
  return useQuery({
    queryKey: ['venue-layouts'],
    queryFn: async (): Promise<VenueLayout[]> => {
      const { data, error } = await supabase
        .from('venue_layouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(layout => ({
        ...layout,
        rows_config: layout.rows_config as unknown as RowConfig[]
      }));
    },
  });
};

export const useSeatsForShow = (showId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`seats-${showId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `show_id=eq.${showId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['seats', showId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, queryClient]);

  return useQuery({
    queryKey: ['seats', showId],
    queryFn: async (): Promise<Seat[]> => {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('show_id', showId)
        .order('row_label')
        .order('seat_number');

      if (error) throw error;
      return (data || []) as Seat[];
    },
    enabled: !!showId,
  });
};

export const useCreateVenueLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: Omit<VenueLayout, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('venue_layouts')
        .insert([{
          name: layout.name,
          venue_name: layout.venue_name,
          rows_config: JSON.parse(JSON.stringify(layout.rows_config)),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-layouts'] });
    },
  });
};

export const useGenerateSeatsForShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ showId, layoutId }: { showId: string; layoutId: string }) => {
      // First get the layout
      const { data: layout, error: layoutError } = await supabase
        .from('venue_layouts')
        .select('*')
        .eq('id', layoutId)
        .single();

      if (layoutError) throw layoutError;

      const rowsConfig = layout.rows_config as unknown as RowConfig[];
      
      // Delete existing seats for this show
      await supabase.from('seats').delete().eq('show_id', showId);

      // Generate new seats based on layout
      const seats: Omit<Seat, 'id' | 'created_at'>[] = [];
      
      for (const row of rowsConfig) {
        for (let i = 1; i <= row.seats; i++) {
          seats.push({
            show_id: showId,
            layout_id: layoutId,
            row_label: row.label,
            seat_number: i,
            tier_id: row.tier_id || null,
            status: 'available',
            order_id: null,
          });
        }
      }

      const { error } = await supabase.from('seats').insert(seats);
      if (error) throw error;

      return seats;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seats', variables.showId] });
    },
  });
};

export const useReserveSeats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seatIds, orderId }: { seatIds: string[]; orderId: string }) => {
      const { error } = await supabase
        .from('seats')
        .update({ status: 'sold', order_id: orderId })
        .in('id', seatIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats'] });
    },
  });
};
