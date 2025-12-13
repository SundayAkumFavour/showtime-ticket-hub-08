import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { TicketDownloadModal } from '@/components/TicketDownloadModal';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  QrCode, 
  Loader2,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';

interface OrderWithDetails {
  id: string;
  reference: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  checked_in?: boolean;
  seat_ids?: string[];
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

const OrderHistory = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useUserOrders(user?.id);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewTicket = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusBadge = (order: OrderWithDetails) => {
    if (order.payment_status !== 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    }
    
    const showDate = order.show ? new Date(order.show.date) : null;
    const isPast = showDate && showDate < new Date();
    
    if (order.checked_in) {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
          <Check className="w-3 h-3" /> Attended
        </span>
      );
    }
    
    if (isPast) {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
          <X className="w-3 h-3" /> Expired
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
        <Ticket className="w-3 h-3" /> Valid
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 md:pt-28 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Order History
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              View all your ticket purchases. Download or print your tickets for upcoming events.
            </p>
          </motion.div>

          {/* Orders List */}
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                      <img
                        src={order.show?.image || '/placeholder.svg'}
                        alt={order.show?.title || 'Event'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Order Info */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(order as OrderWithDetails)}
                            <span className="text-xs text-muted-foreground font-mono">
                              {order.reference}
                            </span>
                          </div>

                          <h3 className="font-display text-xl font-bold text-foreground">
                            {order.show?.title || 'Unknown Event'}
                          </h3>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {order.show?.venue}, {order.show?.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {order.show?.date && format(new Date(order.show.date), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {order.show?.time}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {order.ticket_tier?.name} × {order.quantity}
                            </span>
                            <span className="font-semibold text-foreground">
                              ₦{Number(order.total_amount).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Ordered on {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {order.payment_status === 'completed' && order.show && new Date(order.show.date) > new Date() && (
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => handleViewTicket(order as OrderWithDetails)}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              View Ticket
                            </Button>
                          )}
                          
                          <Link to={`/shows/${order.show?.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Event
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                No orders yet
              </h3>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any tickets yet. Browse our shows and find your next experience!
              </p>
              <Link to="/shows">
                <Button variant="gradient" size="lg">
                  Browse Shows
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Ticket Modal */}
      {selectedOrder && (
        <TicketDownloadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default OrderHistory;
