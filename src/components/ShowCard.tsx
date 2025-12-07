import { Show, getShowStatus } from '@/types/show';
import { CountdownTimer } from './CountdownTimer';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ShowCardProps {
  show: Show;
  index?: number;
}

export const ShowCard = ({ show, index = 0 }: ShowCardProps) => {
  const status = getShowStatus(show);
  const lowestPrice = Math.min(...show.ticketTiers.map(t => t.price));
  const formattedDate = new Date(show.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="show-card group"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={show.image}
          alt={show.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 text-primary-foreground">
            {show.category}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={cn(
            "status-badge",
            status === 'available' && "status-available",
            status === 'soldout' && "status-soldout",
            status === 'passed' && "status-passed"
          )}>
            {status === 'available' && 'Available'}
            {status === 'soldout' && 'Sold Out'}
            {status === 'passed' && 'Passed'}
          </span>
        </div>

        {/* Featured Badge */}
        {show.featured && (
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {show.title}
        </h3>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{show.venue}, {show.location}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{show.time}</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {status === 'available' && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Starts in:</p>
            <CountdownTimer targetDate={show.date} compact />
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-lg font-bold text-foreground">
              ₦{lowestPrice.toLocaleString()}
            </p>
          </div>
          <Link to={`/show/${show.id}`}>
            <Button 
              variant={status === 'available' ? 'gradient' : 'outline'} 
              size="sm"
              disabled={status !== 'available'}
            >
              {status === 'available' ? 'Buy Tickets' : status === 'soldout' ? 'Sold Out' : 'Unavailable'}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
