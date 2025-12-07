import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShowCard } from '@/components/ShowCard';
import { useShows } from '@/hooks/useShows';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getShowStatus } from '@/types/show';

const Shows = () => {
  const { data: shows = [], isLoading } = useShows();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(shows.map((show) => show.category))];

  const filteredShows = shows.filter((show) => {
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      show.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || show.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableShows = filteredShows.filter((s) => getShowStatus(s) === 'available');
  const passedShows = filteredShows.filter((s) => getShowStatus(s) !== 'available');

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
              All Shows
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Browse through all upcoming and past events. Find your next unforgettable experience.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-10"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border h-12"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Available Shows */}
              {availableShows.length > 0 && (
                <section className="mb-16">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Upcoming Events ({availableShows.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableShows.map((show, index) => (
                      <ShowCard key={show.id} show={show} index={index} />
                    ))}
                  </div>
                </section>
              )}

              {/* Past Shows */}
              {passedShows.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-bold text-muted-foreground mb-6">
                    Past Events ({passedShows.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                    {passedShows.map((show, index) => (
                      <ShowCard key={show.id} show={show} index={index} />
                    ))}
                  </div>
                </section>
              )}

              {/* No Results */}
              {filteredShows.length === 0 && (
                <div className="text-center py-20">
                  <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    No shows found
                  </h3>
                  <p className="text-muted-foreground">
                    {shows.length === 0 
                      ? 'No shows have been created yet. Check back soon!' 
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shows;
