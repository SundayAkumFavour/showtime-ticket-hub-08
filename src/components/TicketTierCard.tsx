import { TicketTier } from '@/types/show';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TicketTierCardProps {
  tier: TicketTier;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

const tierColors: Record<string, string> = {
  Regular: 'from-slate-500 to-slate-600',
  Golden: 'from-amber-400 to-amber-600',
  Platinum: 'from-slate-300 to-slate-400',
  VIP: 'from-primary to-accent',
};

const tierIcons: Record<string, boolean> = {
  Regular: false,
  Golden: true,
  Platinum: true,
  VIP: true,
};

export const TicketTierCard = ({ tier, quantity, onQuantityChange, disabled }: TicketTierCardProps) => {
  const available = tier.quantity - tier.sold;
  const isSoldOut = available === 0;
  const isSelected = quantity > 0;

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < Math.min(available, 10)) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "ticket-tier-card",
        isSelected && "border-primary/50 bg-primary/5",
        (isSoldOut || disabled) && "opacity-50"
      )}
    >
      {/* Tier Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r text-foreground",
            tierColors[tier.name]
          )}>
            {tier.name}
          </span>
          {tierIcons[tier.name] && (
            <Sparkles className="w-4 h-4 text-primary" />
          )}
        </div>
        {isSoldOut ? (
          <span className="status-badge status-soldout">Sold Out</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {available} left
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {tier.description}
      </p>

      {/* Price & Quantity */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">
            ₦{tier.price.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">per ticket</p>
        </div>

        {!isSoldOut && !disabled && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={quantity === 0}
              className="h-9 w-9 rounded-full"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={quantity >= Math.min(available, 10)}
              className="h-9 w-9 rounded-full"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
