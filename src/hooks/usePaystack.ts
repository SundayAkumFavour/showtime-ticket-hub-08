import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InitializePaymentParams {
  email: string;
  amount: number; // in naira
  showId: string;
  ticketTierId: string;
  quantity: number;
  seatIds?: string[];
}

export const usePaystack = () => {
  const initializePayment = async (params: InitializePaymentParams) => {
    const { email, amount, showId, ticketTierId, quantity, seatIds } = params;
    
    const callback_url = `${window.location.origin}/payment/verify`;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in to purchase tickets');
      return null;
    }

    const response = await supabase.functions.invoke('paystack-initialize', {
      body: {
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        showId,
        ticketTierId,
        quantity,
        callback_url,
      },
    });

    if (response.error) {
      toast.error(response.error.message || 'Failed to initialize payment');
      return null;
    }

    if (!response.data.success) {
      toast.error(response.data.error || 'Failed to initialize payment');
      return null;
    }

    return response.data;
  };

  const verifyPayment = async (reference: string) => {
    const response = await supabase.functions.invoke('paystack-verify', {
      body: { reference },
    });

    if (response.error) {
      toast.error(response.error.message || 'Payment verification failed');
      return null;
    }

    return response.data;
  };

  return { initializePayment, verifyPayment };
};
