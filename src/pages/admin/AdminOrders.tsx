import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrdersWithDetails } from '@/hooks/useAdminAnalytics';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  Package,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AdminOrders = () => {
  const { data: orders = [], isLoading } = useOrdersWithDetails();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilter, setShowFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');

  // Get unique shows for filter
  const uniqueShows = useMemo(() => {
    const showsMap = new Map();
    orders.forEach((order) => {
      const show = order.show as { id: string; title: string } | null;
      if (show && !showsMap.has(show.id)) {
        showsMap.set(show.id, show.title);
      }
    });
    return Array.from(showsMap.entries()).map(([id, title]) => ({ id, title }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const show = order.show as { id: string; title: string } | null;
        const matchesSearch = 
          order.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          show?.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter;
        const matchesShow = showFilter === 'all' || order.show_id === showFilter;
        return matchesSearch && matchesStatus && matchesShow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [orders, searchQuery, statusFilter, showFilter, dateSort]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Stats
  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalTickets = completedOrders.reduce((sum, o) => sum + o.quantity, 0);

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
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              All Orders
            </h1>
            <p className="text-muted-foreground">
              View and manage all ticket orders
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="glass-card p-5 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">₦{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-foreground">{totalTickets}</p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or show..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={showFilter} onValueChange={setShowFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shows</SelectItem>
                {uniqueShows.map((show) => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.title.length > 25 ? show.title.slice(0, 25) + '...' : show.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {dateSort === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </motion.div>

          {/* Orders Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Show</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const show = order.show as { id: string; title: string; date: string; venue: string } | null;
                    const tier = order.ticket_tier as { id: string; name: string; price: number } | null;
                    const promo = order.promo_code as { id: string; code: string; discount_type: string; discount_value: number } | null;

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.reference.slice(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{show?.title || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{show?.venue}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tier?.name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell className="font-medium">
                          ₦{Number(order.total_amount).toLocaleString()}
                          {order.discount_amount && Number(order.discount_amount) > 0 && (
                            <span className="text-xs text-emerald-500 block">
                              -₦{Number(order.discount_amount).toLocaleString()}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {promo ? (
                            <Badge variant="secondary" className="text-xs">
                              {promo.code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                        <TableCell>
                          {order.checked_in ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500">Yes</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No orders found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminOrders;
