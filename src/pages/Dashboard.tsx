import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, Download, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock orders for demo
const mockOrders = [
  {
    id: '1',
    reference: 'SH-2025-001234',
    show: {
      title: 'Afrobeats Fusion Night',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
      venue: 'Eko Convention Center',
      location: 'Lagos, Nigeria',
      date: '2025-01-15T20:00:00',
      time: '8:00 PM',
    },
    tier: 'Golden',
    quantity: 2,
    totalAmount: 73500,
    paymentStatus: 'completed',
    createdAt: '2024-12-05T10:30:00',
  },
  {
    id: '2',
    reference: 'SH-2025-001235',
    show: {
      title: 'Comedy Night Live',
      image: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&q=80',
      venue: 'National Theatre',
      location: 'Accra, Ghana',
      date: '2025-01-20T19:00:00',
      time: '7:00 PM',
    },
    tier: 'Regular',
    quantity: 4,
    totalAmount: 42000,
    paymentStatus: 'completed',
    createdAt: '2024-12-04T15:45:00',
  },
];

const Dashboard = () => {
  const upcomingOrders = mockOrders.filter(
    (order) => new Date(order.show.date) > new Date()
  );
  const pastOrders = mockOrders.filter(
    (order) => new Date(order.show.date) <= new Date()
  );

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
              My Tickets
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              View and manage all your purchased tickets. Don't forget to download your tickets before the show!
            </p>
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
              { label: 'Total Tickets', value: mockOrders.reduce((sum, o) => sum + o.quantity, 0), icon: Ticket },
              { label: 'Total Spent', value: `₦${mockOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}`, icon: QrCode },
            ].map((stat, index) => (
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
                          src={order.show.image}
                          alt={order.show.title}
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
                              {order.show.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {order.show.venue}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.show.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {order.show.time}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {order.tier} × {order.quantity}
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              ₦{order.totalAmount.toLocaleString()}
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Download className="w-4 h-4 mr-2" />
                              Download Ticket
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
                        <h3 className="font-bold text-foreground">{order.show.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.show.date).toLocaleDateString()} • {order.tier} × {order.quantity}
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
          {mockOrders.length === 0 && (
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
    </div>
  );
};

export default Dashboard;
