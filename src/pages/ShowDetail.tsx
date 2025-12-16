import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TicketTierCard } from '@/components/TicketTierCard';
import { SeatSelector } from '@/components/SeatSelector';
import { WaitlistButton } from '@/components/WaitlistButton';
import { PromoCodeInput } from '@/components/PromoCodeInput';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShow } from '@/hooks/useShows';
import { useSeatsForShow, Seat } from '@/hooks/useSeats';
import { useAuth } from '@/hooks/useAuth';
import { usePaystack } from '@/hooks/usePaystack';
import { PromoCode, calculateDiscount } from '@/hooks/usePromoCodes';
import { getShowStatus } from '@/types/show';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, ArrowLeft, ShoppingCart, Ticket, Loader2, Armchair } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: show, isLoading } = useShow(id || '');
  const { data: seats = [] } = useSeatsForShow(id || '');
  const { user, session } = useAuth();
  const { initializePayment } = usePaystack();
  
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'tier' | 'seat'>('tier');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const hasSeatingLayout = seats.length > 0;

  const status = show ? getShowStatus(show) : 'passed';
  const isAvailable = status === 'available';
  const isSoldOut = status === 'soldout';

  // Calculate totals based on selection mode
  const { totalItems, totalAmount, selectedSeatDetails } = useMemo(() => {
    if (selectionMode === 'seat' && hasSeatingLayout) {
      const seatDetails = selectedSeats
        .map((seatId) => seats.find((s) => s.id === seatId))
        .filter(Boolean) as Seat[];
      
      const amount = seatDetails.reduce((sum, seat) => {
        const tier = show?.ticketTiers.find((t) => t.id === seat.tier_id);
        return sum + (tier?.price || 0);
      }, 0);

      return {
        totalItems: selectedSeats.length,
        totalAmount: amount,
        selectedSeatDetails: seatDetails,
      };
    } else {
      const items = Object.values(selectedTiers).reduce((sum, qty) => sum + qty, 0);
      const amount = show?.ticketTiers.reduce((sum, tier) => {
        const qty = selectedTiers[tier.id] || 0;
        return sum + tier.price * qty;
      }, 0) || 0;

      return {
        totalItems: items,
        totalAmount: amount,
        selectedSeatDetails: [],
      };
    }
  }, [selectedTiers, selectedSeats, selectionMode, hasSeatingLayout, seats, show]);

  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelectedTiers((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const handleSeatSelect = (seatId: string, seat: Seat) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      return [...prev, seatId];
    });
  };

  const handlePromoApply = (promo: PromoCode | null, discount: number) => {
    setAppliedPromo(promo);
    setPromoDiscount(discount);
  };

  // Recalculate promo discount when subtotal changes
  const currentPromoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    return calculateDiscount(appliedPromo, totalAmount);
  }, [appliedPromo, totalAmount]);

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
      if (!show) {
        toast.error('Show not found');
        return;
      }

      let ticketTierId: string;
      let quantity: number;
      let tierPrice: number;
      let seatIds: string[] = [];

      if (selectionMode === 'seat' && hasSeatingLayout && selectedSeatDetails.length > 0) {
        // For seat selection, use the tier of the first seat (or group by tier in future)
        const firstSeat = selectedSeatDetails[0];
        ticketTierId = firstSeat.tier_id || show.ticketTiers[0].id;
        quantity = selectedSeats.length;
        seatIds = selectedSeats;
        
        const tier = show.ticketTiers.find((t) => t.id === ticketTierId);
        tierPrice = tier?.price || 0;
      } else {
        // For tier-based selection
        const selectedTierId = Object.keys(selectedTiers).find((id) => selectedTiers[id] > 0);
        if (!selectedTierId) {
          toast.error('Please select a ticket tier');
          return;
        }

        ticketTierId = selectedTierId;
        quantity = selectedTiers[selectedTierId];
        const tier = show.ticketTiers.find((t) => t.id === selectedTierId);
        if (!tier) {
          toast.error('Invalid ticket tier');
          return;
        }
        tierPrice = tier.price;
      }

      const discountedAmount = totalAmount - currentPromoDiscount;
      const amount = discountedAmount * 1.05; // Including 5% service fee

      const result = await initializePayment({
        email: user.email || '',
        amount,
        showId: show.id,
        ticketTierId,
        quantity,
        seatIds,
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

              {/* Ticket Selection */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Select Tickets
                </h2>

                {hasSeatingLayout ? (
                  <Tabs value={selectionMode} onValueChange={(v) => {
                    setSelectionMode(v as 'tier' | 'seat');
                    setSelectedSeats([]);
                    setSelectedTiers({});
                  }}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="tier" className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        By Tier
                      </TabsTrigger>
                      <TabsTrigger value="seat" className="flex items-center gap-2">
                        <Armchair className="w-4 h-4" />
                        Choose Seat
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tier" className="space-y-4">
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
                    </TabsContent>

                    <TabsContent value="seat">
                      <div className="glass-card p-6 rounded-2xl">
                        <SeatSelector
                          showId={show.id}
                          ticketTiers={show.ticketTiers}
                          selectedSeats={selectedSeats}
                          onSeatSelect={handleSeatSelect}
                          disabled={!isAvailable}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
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
                )}
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
                    {selectionMode === 'seat' && hasSeatingLayout ? (
                      // Seat selection summary
                      <div className="space-y-2">
                        {selectedSeatDetails.map((seat) => {
                          const tier = show.ticketTiers.find((t) => t.id === seat.tier_id);
                          return (
                            <div key={seat.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Seat {seat.row_label}{seat.seat_number} ({tier?.name || 'Regular'})
                              </span>
                              <span className="text-foreground font-medium">
                                ₦{(tier?.price || 0).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Tier selection summary
                      show.ticketTiers.map((tier) => {
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
                      })
                    )}

                    {/* Promo Code Input */}
                    <div className="border-t border-border pt-4">
                      <PromoCodeInput
                        showId={show.id}
                        subtotal={totalAmount}
                        onApply={handlePromoApply}
                        appliedPromo={appliedPromo}
                      />
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground font-medium">
                          ₦{totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {currentPromoDiscount > 0 && (
                        <div className="flex justify-between mt-2 text-primary">
                          <span>Discount</span>
                          <span className="font-medium">
                            -₦{currentPromoDiscount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between mt-2">
                        <span className="text-muted-foreground">Service Fee (5%)</span>
                        <span className="text-foreground font-medium">
                          ₦{Math.round((totalAmount - currentPromoDiscount) * 0.05).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="gradient-text">
                          ₦{Math.round((totalAmount - currentPromoDiscount) * 1.05).toLocaleString()}
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

                {/* Waitlist button for sold out shows */}
                {isSoldOut && (
                  <WaitlistButton
                    showId={show.id}
                    showTitle={show.title}
                    variant="outline"
                    className="w-full mt-3"
                  />
                )}

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
