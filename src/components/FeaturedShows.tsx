import { Show, getShowStatus } from '@/types/show';
import { ShowCard } from './ShowCard';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FeaturedShowsProps {
  shows: Show[];
}

export const FeaturedShows = ({ shows }: FeaturedShowsProps) => {
  const availableShows = shows.filter((show) => getShowStatus(show) === 'available');

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Upcoming Events
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2">
              Featured Shows
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg">
              Don't miss out on the hottest events. Secure your tickets now before they sell out.
            </p>
          </div>
          <Link to="/shows" className="mt-6 md:mt-0">
            <Button variant="ghost" className="group">
              View All Shows
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Shows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableShows.slice(0, 6).map((show, index) => (
            <ShowCard key={show.id} show={show} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
