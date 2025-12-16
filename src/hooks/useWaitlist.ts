import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  user_id: string;
  show_id: string;
  email: string;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
}

export const useWaitlistForShow = (showId: string) => {
  return useQuery({
    queryKey: ['waitlist', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('show_id', showId);

      if (error) throw error;
      return data as WaitlistEntry[];
    },
    enabled: !!showId,
  });
};

export const useUserWaitlistEntry = (showId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ['waitlist', showId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('show_id', showId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as WaitlistEntry | null;
    },
    enabled: !!showId && !!userId,
  });
};

export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ showId, email }: { showId: string; email: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          show_id: showId,
          user_id: user.id,
          email,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', variables.showId] });
      toast.success('You\'ve been added to the waitlist! We\'ll notify you when tickets become available.');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You\'re already on the waitlist for this show');
      } else {
        toast.error(error.message || 'Failed to join waitlist');
      }
    },
  });
};

export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ showId }: { showId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('show_id', showId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', variables.showId] });
      toast.success('You\'ve been removed from the waitlist');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to leave waitlist');
    },
  });
};
