import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockShows } from '@/data/mockShows';
import { getShowStatus, Show } from '@/types/show';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Ticket,
  DollarSign,
  Calendar,
  Users,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const Admin = () => {
  const [shows, setShows] = useState(mockShows);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredShows = shows.filter((show) =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalTicketsSold = shows.reduce(
    (sum, show) => sum + show.ticketTiers.reduce((s, t) => s + t.sold, 0),
    0
  );
  const totalRevenue = shows.reduce(
    (sum, show) =>
      sum + show.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0),
    0
  );
  const soldOutShows = shows.filter(
    (s) => getShowStatus(s) === 'soldout'
  ).length;
  const passedShows = shows.filter((s) => getShowStatus(s) === 'passed').length;

  const handleDeleteShow = (showId: string) => {
    setShows((prev) => prev.filter((s) => s.id !== showId));
    toast.success('Show deleted successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
          >
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage shows, view analytics, and track sales.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Show
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Add New Show</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success('Show created successfully!');
                    setIsAddDialogOpen(false);
                  }}
                  className="space-y-4 mt-4"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground">Show Title</label>
                    <Input placeholder="Enter show title" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea placeholder="Enter show description" className="mt-1" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Venue</label>
                      <Input placeholder="Venue name" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Location</label>
                      <Input placeholder="City, Country" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Date</label>
                      <Input type="date" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Time</label>
                      <Input type="time" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <Input placeholder="Music, Comedy, etc." className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Image URL</label>
                    <Input placeholder="https://..." className="mt-1" />
                  </div>
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Ticket Tiers</h4>
                    {['Regular', 'Golden', 'Platinum', 'VIP'].map((tier) => (
                      <div key={tier} className="grid grid-cols-3 gap-2 mb-2">
                        <Input placeholder={tier} disabled value={tier} />
                        <Input type="number" placeholder="Price" />
                        <Input type="number" placeholder="Quantity" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="gradient" className="flex-1">
                      Create Show
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            {[
              {
                label: 'Total Revenue',
                value: `₦${totalRevenue.toLocaleString()}`,
                icon: DollarSign,
                color: 'from-emerald-500 to-emerald-600',
              },
              {
                label: 'Tickets Sold',
                value: totalTicketsSold.toLocaleString(),
                icon: Ticket,
                color: 'from-primary to-accent',
              },
              {
                label: 'Sold Out Shows',
                value: soldOutShows,
                icon: Users,
                color: 'from-amber-500 to-orange-500',
              },
              {
                label: 'Past Shows',
                value: passedShows,
                icon: Calendar,
                color: 'from-slate-500 to-slate-600',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card p-6 rounded-2xl"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Shows List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">
                All Shows ({shows.length})
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Show</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tickets Sold</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShows.map((show) => {
                      const status = getShowStatus(show);
                      const ticketsSold = show.ticketTiers.reduce((s, t) => s + t.sold, 0);
                      const totalTickets = show.ticketTiers.reduce((s, t) => s + t.quantity, 0);
                      const revenue = show.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0);

                      return (
                        <tr key={show.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={show.image}
                                alt={show.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium text-foreground">{show.title}</p>
                                <p className="text-xs text-muted-foreground">{show.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(show.date).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`status-badge ${
                              status === 'available' ? 'status-available' :
                              status === 'soldout' ? 'status-soldout' : 'status-passed'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {ticketsSold} / {totalTickets}
                          </td>
                          <td className="p-4 text-sm font-medium text-foreground">
                            ₦{revenue.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteShow(show.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
