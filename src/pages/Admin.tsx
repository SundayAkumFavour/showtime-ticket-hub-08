import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShows, useCreateShow, useUpdateShow, useDeleteShow } from '@/hooks/useShows';
import { getShowStatus, Show } from '@/types/show';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Ticket,
  Calendar,
  Users,
  Search,
  Loader2,
  LayoutGrid,
  Scan,
  BarChart3,
  Tag,
  Bell,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { VenueLayoutManager } from '@/components/admin/VenueLayoutManager';
import { PromoCodeManager } from '@/components/admin/PromoCodeManager';
import { PromoCodeAnalytics } from '@/components/admin/PromoCodeAnalytics';
import { WaitlistManager } from '@/components/admin/WaitlistManager';
import { ShowForm, ShowFormData } from '@/components/admin/ShowForm';

const Admin = () => {
  const { data: shows = [], isLoading } = useShows();
  const createShow = useCreateShow();
  const updateShow = useUpdateShow();
  const deleteShow = useDeleteShow();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);

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

  const handleCreateShow = (data: ShowFormData) => {
    createShow.mutate(data, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleUpdateShow = (data: ShowFormData) => {
    if (!editingShow) return;
    updateShow.mutate({ id: editingShow.id, ...data }, {
      onSuccess: () => setEditingShow(null),
    });
  };

  const handleDeleteShow = (showId: string) => {
    if (confirm('Are you sure you want to delete this show?')) {
      deleteShow.mutate(showId);
    }
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
            className="mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage shows, users, and track sales.
            </p>
          </motion.div>

          <div className="flex items-center gap-4 mb-6">
          <Tabs defaultValue="shows" className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="shows">Shows</TabsTrigger>
                  <TabsTrigger value="venues">Venue Layouts</TabsTrigger>
                  <TabsTrigger value="promos">Promo Codes</TabsTrigger>
                  <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Link to="/admin/analytics">
                    <Button variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </Link>
                  <Link to="/admin/scanner">
                    <Button variant="outline">
                      <Scan className="w-4 h-4 mr-2" />
                      Ticket Scanner
                    </Button>
                  </Link>
                </div>
              </div>

            <TabsContent value="shows" className="space-y-8">
              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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
                  <div key={stat.label} className="glass-card p-6 rounded-2xl">
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
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search shows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="gradient">
                          <Plus className="w-5 h-5 mr-2" />
                          Add Show
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="font-display text-2xl">Add New Show</DialogTitle>
                        </DialogHeader>
                        <ShowForm
                          onSubmit={handleCreateShow}
                          onCancel={() => setIsAddDialogOpen(false)}
                          isLoading={createShow.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                                    <Dialog open={editingShow?.id === show.id} onOpenChange={(open) => !open && setEditingShow(null)}>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingShow(show)}>
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle className="font-display text-2xl">Edit Show</DialogTitle>
                                        </DialogHeader>
                                        {editingShow && (
                                          <ShowForm
                                            initialData={editingShow}
                                            onSubmit={handleUpdateShow}
                                            onCancel={() => setEditingShow(null)}
                                            isLoading={updateShow.isPending}
                                          />
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteShow(show.id)}
                                      disabled={deleteShow.isPending}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredShows.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                No shows found. Create your first show!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="venues">
              <VenueLayoutManager />
            </TabsContent>

            <TabsContent value="promos" className="space-y-8">
              <PromoCodeManager />
              <PromoCodeAnalytics />
            </TabsContent>

            <TabsContent value="waitlist">
              <WaitlistManager />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
