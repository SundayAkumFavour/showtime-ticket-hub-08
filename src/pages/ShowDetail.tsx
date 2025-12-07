import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TicketTierCard } from '@/components/TicketTierCard';
import { Button } from '@/components/ui/button';
import { useShow } from '@/hooks/useShows';
import { useAuth } from '@/hooks/useAuth';
import { usePaystack } from '@/hooks/usePaystack';
import { getShowStatus } from '@/types/show';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, ArrowLeft, ShoppingCart, Ticket, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: show, isLoading } = useShow(id || '');
  const { user, session } = useAuth();
  const { initializePayment } = usePaystack();
  
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const status = show ? getShowStatus(show) : 'passed';
  const isAvailable = status === 'available';

  const totalItems = useMemo(() => {
    return Object.values(selectedTiers).reduce((sum, qty) => sum + qty, 0);
  }, [selectedTiers]);

  const totalAmount = useMemo(() => {
    if (!show) return 0;
    return show.ticketTiers.reduce((sum, tier) => {
      const qty = selectedTiers[tier.id] || 0;
      return sum + tier.price * qty;
    }, 0);
  }, [selectedTiers, show]);

  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelectedTiers((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const handleCheckout = async () => {
    if (totalItems === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    if (!user || !session) {
      toast.error('Please log in to purchase tickets');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      // Get the first selected tier (for now, one tier at a time)
      const selectedTierId = Object.keys(selectedTiers).find((id) => selectedTiers[id] > 0);
      if (!selectedTierId || !show) {
        toast.error('Please select a ticket tier');
        return;
      }

      const quantity = selectedTiers[selectedTierId];
      const tier = show.ticketTiers.find((t) => t.id === selectedTierId);
      if (!tier) {
        toast.error('Invalid ticket tier');
        return;
      }

      const amount = tier.price * quantity * 1.05; // Including 5% service fee

      const result = await initializePayment({
        email: user.email || '',
        amount,
        showId: show.id,
        ticketTierId: selectedTierId,
        quantity,
      });

      if (result?.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initialize payment');
    } finally {
      setIsProcessing(false);
    }
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

  if (!show) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 md:pt-28 pb-16">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">
              Show not found
            </h1>
            <Link to="/shows">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shows
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedDate = new Date(show.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 md:pt-20">
        {/* Hero Image */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={show.image}
            alt={show.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Back Button */}
          <div className="absolute top-24 left-4 md:left-8">
            <Link to="/shows">
              <Button variant="glass" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Show Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Category & Status */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 text-primary-foreground">
                  {show.category}
                </span>
                <span className={`status-badge ${
                  status === 'available' ? 'status-available' :
                  status === 'soldout' ? 'status-soldout' : 'status-passed'
                }`}>
                  {status === 'available' ? 'Available' :
                   status === 'soldout' ? 'Sold Out' : 'Passed'}
                </span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                {show.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{show.venue}, {show.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>{show.time}</span>
                </div>
              </div>

              {/* Countdown */}
              {isAvailable && (
                <div className="glass-card p-6 rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-3">Show starts in:</p>
                  <CountdownTimer targetDate={show.date} />
                </div>
              )}

              {/* Description */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-display text-xl font-bold text-foreground mb-3">
                  About This Event
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {show.description}
                </p>
              </div>

              {/* Ticket Tiers */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Select Tickets
                </h2>
                <div className="space-y-4">
                  {show.ticketTiers.map((tier, index) => (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TicketTierCard
                        tier={tier}
                        quantity={selectedTiers[tier.id] || 0}
                        onQuantityChange={(qty) => handleQuantityChange(tier.id, qty)}
                        disabled={!isAvailable}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 glass-card p-6 rounded-2xl">
                <h3 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Order Summary
                </h3>

                {totalItems === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select tickets to see your order summary
                  </p>
                ) : (
                  <div className="space-y-4">
                    {show.ticketTiers.map((tier) => {
                      const qty = selectedTiers[tier.id] || 0;
                      if (qty === 0) return null;
                      return (
                        <div key={tier.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {tier.name} × {qty}
                          </span>
                          <span className="text-foreground font-medium">
                            ₦{(tier.price * qty).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground font-medium">
                          ₦{totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-muted-foreground">Service Fee (5%)</span>
                        <span className="text-foreground font-medium">
                          ₦{Math.round(totalAmount * 0.05).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="gradient-text">
                          ₦{Math.round(totalAmount * 1.05).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full mt-6"
                  disabled={totalItems === 0 || !isAvailable || isProcessing}
                  onClick={handleCheckout}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-5 h-5 mr-2" />
                      {isAvailable ? 'Proceed to Payment' : 'Currently Unavailable'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure payment powered by Paystack
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="h-20" />
      </main>
      <Footer />
    </div>
  );
};

export default ShowDetail;
