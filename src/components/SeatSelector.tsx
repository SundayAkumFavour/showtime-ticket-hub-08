import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSeatsForShow, Seat } from '@/hooks/useSeats';
import { TicketTier } from '@/types/show';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SeatSelectorProps {
  showId: string;
  ticketTiers: TicketTier[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string, seat: Seat) => void;
  disabled?: boolean;
}

const tierColors: Record<string, string> = {
  Regular: 'bg-blue-500 hover:bg-blue-400',
  Golden: 'bg-amber-500 hover:bg-amber-400',
  Platinum: 'bg-purple-500 hover:bg-purple-400',
  VIP: 'bg-rose-500 hover:bg-rose-400',
};

export const SeatSelector = ({
  showId,
  ticketTiers,
  selectedSeats,
  onSeatSelect,
  disabled = false,
}: SeatSelectorProps) => {
  const { data: seats = [], isLoading } = useSeatsForShow(showId);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const seatsByRow = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row_label]) {
        grouped[seat.row_label] = [];
      }
      grouped[seat.row_label].push(seat);
    });
    // Sort seats within each row
    Object.values(grouped).forEach((row) => {
      row.sort((a, b) => a.seat_number - b.seat_number);
    });
    return grouped;
  }, [seats]);

  const sortedRows = useMemo(() => {
    return Object.keys(seatsByRow).sort();
  }, [seatsByRow]);

  const getTierName = (tierId: string | null) => {
    if (!tierId) return 'Regular';
    const tier = ticketTiers.find((t) => t.id === tierId);
    return tier?.name || 'Regular';
  };

  const getTierPrice = (tierId: string | null) => {
    if (!tierId) return 0;
    const tier = ticketTiers.find((t) => t.id === tierId);
    return tier?.price || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No seating layout available for this show.</p>
        <p className="text-sm mt-2">Please contact the organizer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage indicator */}
      <div className="relative">
        <div className="w-3/4 mx-auto h-8 bg-gradient-to-b from-primary/50 to-primary/20 rounded-t-full flex items-center justify-center">
          <span className="text-xs font-semibold text-primary-foreground/80">STAGE</span>
        </div>
      </div>

      {/* Seating grid */}
      <div className="space-y-2 overflow-x-auto pb-4">
        {sortedRows.map((rowLabel, rowIndex) => {
          const rowSeats = seatsByRow[rowLabel];
          const curveOffset = Math.abs(rowIndex - sortedRows.length / 2) * 2;

          return (
            <motion.div
              key={rowLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className="flex items-center justify-center gap-1"
              style={{ paddingLeft: `${curveOffset}px`, paddingRight: `${curveOffset}px` }}
            >
              <span className="w-6 text-xs font-semibold text-muted-foreground text-right">
                {rowLabel}
              </span>
              <div className="flex gap-1">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id);
                  const isAvailable = seat.status === 'available';
                  const tierName = getTierName(seat.tier_id);
                  const tierColor = tierColors[tierName] || 'bg-muted';

                  return (
                    <button
                      key={seat.id}
                      disabled={!isAvailable || disabled}
                      onClick={() => onSeatSelect(seat.id, seat)}
                      onMouseEnter={() => setHoveredSeat(seat.id)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      className={cn(
                        'w-6 h-6 rounded-t-lg text-[10px] font-semibold transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                        isAvailable
                          ? isSelected
                            ? 'bg-primary text-primary-foreground scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : tierColor + ' text-white cursor-pointer'
                          : 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed'
                      )}
                      title={`${rowLabel}${seat.seat_number} - ${tierName} - ₦${getTierPrice(seat.tier_id).toLocaleString()}`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>
              <span className="w-6 text-xs font-semibold text-muted-foreground">
                {rowLabel}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-border">
        {ticketTiers.map((tier) => (
          <div key={tier.id} className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-t-md',
                tierColors[tier.name] || 'bg-muted'
              )}
            />
            <span className="text-xs text-muted-foreground">
              {tier.name} - ₦{tier.price.toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-t-md bg-muted/30" />
          <span className="text-xs text-muted-foreground">Sold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-t-md bg-primary ring-2 ring-primary ring-offset-1 ring-offset-background" />
          <span className="text-xs text-muted-foreground">Selected</span>
        </div>
      </div>

      {/* Hovered seat tooltip */}
      {hoveredSeat && (
        <div className="text-center text-sm text-muted-foreground">
          {(() => {
            const seat = seats.find((s) => s.id === hoveredSeat);
            if (!seat) return null;
            const tierName = getTierName(seat.tier_id);
            const price = getTierPrice(seat.tier_id);
            return `Seat ${seat.row_label}${seat.seat_number} • ${tierName} • ₦${price.toLocaleString()}`;
          })()}
        </div>
      )}
    </div>
  );
};
