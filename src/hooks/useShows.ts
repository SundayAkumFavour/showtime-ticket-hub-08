import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Show, TicketTier } from '@/types/show';
import { toast } from 'sonner';

interface DbShow {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  location: string;
  venue: string;
  date: string;
  time: string;
  category: string;
  featured: boolean | null;
  created_at: string;
  updated_at: string;
}

interface DbTicketTier {
  id: string;
  show_id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  description: string | null;
}

// Transform DB data to app types
const transformShow = (show: DbShow, tiers: DbTicketTier[]): Show => ({
  id: show.id,
  title: show.title,
  description: show.description || '',
  image: show.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
  location: show.location,
  venue: show.venue,
  date: show.date,
  time: show.time,
  category: show.category,
  featured: show.featured || false,
  ticketTiers: tiers.map((tier) => ({
    id: tier.id,
    name: tier.name as TicketTier['name'],
    price: Number(tier.price),
    quantity: tier.quantity,
    sold: tier.sold,
    description: tier.description || '',
  })),
});

export const useShows = () => {
  return useQuery({
    queryKey: ['shows'],
    queryFn: async (): Promise<Show[]> => {
      const { data: shows, error: showsError } = await supabase
        .from('shows')
        .select('*')
        .order('date', { ascending: true });

      if (showsError) throw showsError;

      const { data: tiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('*');

      if (tiersError) throw tiersError;

      return (shows || []).map((show) =>
        transformShow(show, (tiers || []).filter((t) => t.show_id === show.id))
      );
    },
  });
};

export const useShow = (id: string) => {
  return useQuery({
    queryKey: ['show', id],
    queryFn: async (): Promise<Show | null> => {
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (showError) throw showError;
      if (!show) return null;

      const { data: tiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('show_id', id);

      if (tiersError) throw tiersError;

      return transformShow(show, tiers || []);
    },
    enabled: !!id,
  });
};

interface CreateShowInput {
  title: string;
  description: string;
  image: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  category: string;
  featured: boolean;
  ticketTiers: {
    name: string;
    price: number;
    quantity: number;
    description: string;
  }[];
}

export const useCreateShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShowInput) => {
      const { data: show, error: showError } = await supabase
        .from('shows')
        .insert({
          title: input.title,
          description: input.description,
          image: input.image,
          location: input.location,
          venue: input.venue,
          date: input.date,
          time: input.time,
          category: input.category,
          featured: input.featured,
        })
        .select()
        .single();

      if (showError) throw showError;

      const tiersToInsert = input.ticketTiers
        .filter((t) => t.quantity > 0)
        .map((tier) => ({
          show_id: show.id,
          name: tier.name,
          price: tier.price,
          quantity: tier.quantity,
          description: tier.description,
        }));

      if (tiersToInsert.length > 0) {
        const { error: tiersError } = await supabase
          .from('ticket_tiers')
          .insert(tiersToInsert);

        if (tiersError) throw tiersError;
      }

      return show;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      toast.success('Show created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create show');
    },
  });
};

export const useUpdateShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CreateShowInput & { id: string }) => {
      const { error: showError } = await supabase
        .from('shows')
        .update({
          title: input.title,
          description: input.description,
          image: input.image,
          location: input.location,
          venue: input.venue,
          date: input.date,
          time: input.time,
          category: input.category,
          featured: input.featured,
        })
        .eq('id', id);

      if (showError) throw showError;

      // Delete existing tiers and recreate
      await supabase.from('ticket_tiers').delete().eq('show_id', id);

      const tiersToInsert = input.ticketTiers
        .filter((t) => t.quantity > 0)
        .map((tier) => ({
          show_id: id,
          name: tier.name,
          price: tier.price,
          quantity: tier.quantity,
          description: tier.description,
        }));

      if (tiersToInsert.length > 0) {
        const { error: tiersError } = await supabase
          .from('ticket_tiers')
          .insert(tiersToInsert);

        if (tiersError) throw tiersError;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      toast.success('Show updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update show');
    },
  });
};

export const useDeleteShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shows').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      toast.success('Show deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete show');
    },
  });
};
