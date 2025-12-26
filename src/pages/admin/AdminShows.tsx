import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useShows, useDeleteShow } from '@/hooks/useShows';
import { getShowStatus, Show } from '@/types/show';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Calendar,
  MapPin,
  Ticket,
  DollarSign,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminShows = () => {
  const { data: shows = [], isLoading } = useShows();
  const deleteShow = useDeleteShow();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredShows = shows.filter((show) => {
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getShowStatus(show);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteShow = (showId: string) => {
    deleteShow.mutate(showId);
  };

  const getStatusBadge = (show: Show) => {
    const status = getShowStatus(show);
    switch (status) {
      case 'available':
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Available</Badge>;
      case 'soldout':
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Sold Out</Badge>;
      case 'passed':
        return <Badge className="bg-slate-500/20 text-slate-500 border-slate-500/30">Passed</Badge>;
      default:
        return null;
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
                  Manage Shows
                </h1>
                <p className="text-muted-foreground">
                  Create, edit, and manage all your shows ({shows.length} total)
                </p>
              </div>
              <Link to="/admin/shows/create">
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Show
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="soldout">Sold Out</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Shows Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredShows.map((show, index) => {
              const status = getShowStatus(show);
              const isPassed = status === 'passed';
              const ticketsSold = show.ticketTiers.reduce((s, t) => s + t.sold, 0);
              const totalTickets = show.ticketTiers.reduce((s, t) => s + t.quantity, 0);
              const revenue = show.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0);

              return (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`glass-card rounded-2xl overflow-hidden ${isPassed ? 'opacity-70' : ''}`}
                >
                  <div className="relative">
                    <img
                      src={show.image || '/placeholder.svg'}
                      alt={show.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(show)}
                    </div>
                    {isPassed && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-lg py-2 px-4">
                          Show Passed
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-foreground mb-2 line-clamp-1">
                      {show.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(show.date).toLocaleDateString()} at {show.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{show.venue}, {show.location}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Ticket className="w-3 h-3" />
                          Tickets
                        </div>
                        <p className="font-semibold text-foreground">
                          {ticketsSold} / {totalTickets}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <DollarSign className="w-3 h-3" />
                          Revenue
                        </div>
                        <p className="font-semibold text-foreground">
                          ₦{revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Tier breakdown */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Ticket Tiers:</p>
                      <div className="flex flex-wrap gap-1">
                        {show.ticketTiers.map((tier) => (
                          <Badge 
                            key={tier.id} 
                            variant="outline" 
                            className={`text-xs ${tier.sold >= tier.quantity ? 'bg-destructive/10 text-destructive border-destructive/30' : ''}`}
                          >
                            {tier.name}: {tier.sold}/{tier.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link to={`/show/${show.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {!isPassed && (
                        <Link to={`/admin/shows/${show.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                              Delete Show
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{show.title}"? This will also disable all ticket purchases. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteShow(show.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredShows.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No shows found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first show to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link to="/admin/shows/create">
                  <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Show
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminShows;
