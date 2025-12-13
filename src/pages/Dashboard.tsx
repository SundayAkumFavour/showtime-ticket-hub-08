import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { TicketDownloadModal } from '@/components/TicketDownloadModal';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, Download, QrCode, Loader2, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrders } from '@/hooks/useOrders';

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

const Dashboard = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useUserOrders(user?.id);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const upcomingOrders = orders.filter(
    (order) => order.show && new Date(order.show.date) > new Date() && order.payment_status === 'completed'
  );
  const pastOrders = orders.filter(
    (order) => order.show && new Date(order.show.date) <= new Date() && order.payment_status === 'completed'
  );
  const completedOrders = orders.filter((order) => order.payment_status === 'completed');

  const handleViewTicket = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
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
            className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                My Tickets
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                View and manage all your purchased tickets. Download your tickets with QR codes before the show!
              </p>
            </div>
            <Link to="/orders">
              <Button variant="outline" className="shrink-0">
                <History className="w-4 h-4 mr-2" />
                Order History
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          >
            {[
              { label: 'Upcoming Events', value: upcomingOrders.length, icon: Calendar },
              { label: 'Total Tickets', value: completedOrders.reduce((sum, o) => sum + o.quantity, 0), icon: Ticket },
              { label: 'Total Spent', value: `₦${completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}`, icon: QrCode },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card p-6 rounded-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Upcoming Tickets */}
          {upcomingOrders.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48 h-32 md:h-auto">
                        <img
                          src={order.show?.image || '/placeholder.svg'}
                          alt={order.show?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="status-badge status-available">Upcoming</span>
                              <span className="text-xs text-muted-foreground">
                                Ref: {order.reference}
                              </span>
                            </div>
                            <h3 className="font-display text-xl font-bold text-foreground mb-2">
                              {order.show?.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {order.show?.venue}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {order.show?.date && new Date(order.show.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {order.show?.time}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {order.ticket_tier?.name} × {order.quantity}
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              ₦{Number(order.total_amount).toLocaleString()}
                            </p>
                            <Button 
                              variant="gradient" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleViewTicket(order as OrderWithDetails)}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              View Ticket
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Past Orders */}
          {pastOrders.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-muted-foreground mb-6">
                Past Events
              </h2>
              <div className="space-y-4 opacity-60">
                {pastOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{order.show?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.show?.date && new Date(order.show.date).toLocaleDateString()} • {order.ticket_tier?.name} × {order.quantity}
                        </p>
                      </div>
                      <span className="status-badge status-passed">Completed</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                No tickets yet
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

export default Dashboard;
