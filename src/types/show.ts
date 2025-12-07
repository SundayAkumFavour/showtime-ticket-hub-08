export interface TicketTier {
  id: string;
  name: 'Regular' | 'Golden' | 'Platinum' | 'VIP';
  price: number;
  quantity: number;
  sold: number;
  description: string;
}

export interface Show {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  venue: string;
  date: string; // ISO date string
  time: string;
  ticketTiers: TicketTier[];
  featured?: boolean;
  category: string;
}

export interface Order {
  id: string;
  userId: string;
  showId: string;
  ticketTierId: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: string;
}

export type ShowStatus = 'available' | 'soldout' | 'passed';

export const getShowStatus = (show: Show): ShowStatus => {
  const showDate = new Date(show.date);
  const now = new Date();
  
  if (showDate < now) {
    return 'passed';
  }
  
  const totalAvailable = show.ticketTiers.reduce(
    (sum, tier) => sum + (tier.quantity - tier.sold),
    0
  );
  
  if (totalAvailable === 0) {
    return 'soldout';
  }
  
  return 'available';
};
