import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShows } from '@/hooks/useShows';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Ticket,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#8b5cf6'];

const Analytics = () => {
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const [selectedShowId, setSelectedShowId] = useState<string>('all');

  // Fetch all orders for analytics
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          show:shows(id, title, date),
          ticket_tier:ticket_tiers(name, price)
        `)
        .eq('payment_status', 'completed');

      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = showsLoading || ordersLoading;

  // Filter orders by selected show
  const filteredOrders = selectedShowId === 'all' 
    ? orders 
    : orders.filter(o => o.show_id === selectedShowId);

  // Calculate analytics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalTickets = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);
  const checkedInCount = filteredOrders.filter(o => o.checked_in).reduce((sum, o) => sum + o.quantity, 0);
  const checkInRate = totalTickets > 0 ? ((checkedInCount / totalTickets) * 100).toFixed(1) : 0;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.user_id)).size;

  // Revenue by show for bar chart
  const revenueByShow = shows.map(show => {
    const showOrders = orders.filter(o => o.show_id === show.id);
    const revenue = showOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const tickets = showOrders.reduce((sum, o) => sum + o.quantity, 0);
    return {
      name: show.title.length > 15 ? show.title.substring(0, 15) + '...' : show.title,
      fullName: show.title,
      revenue,
      tickets,
    };
  }).filter(s => s.revenue > 0).slice(0, 10);

  // Ticket tier distribution for pie chart
  const tierDistribution = filteredOrders.reduce((acc, order) => {
    const tierName = order.ticket_tier?.name || 'Unknown';
    acc[tierName] = (acc[tierName] || 0) + order.quantity;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(tierDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Check-in status for pie chart
  const checkInData = [
    { name: 'Checked In', value: checkedInCount },
    { name: 'Not Checked In', value: totalTickets - checkedInCount },
  ];

  // Sales over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const salesByDay = last30Days.map(date => {
    const dayOrders = filteredOrders.filter(o => 
      o.created_at.split('T')[0] === date
    );
    return {
      date: date.slice(5), // MM-DD format
      sales: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      tickets: dayOrders.reduce((sum, o) => sum + o.quantity, 0),
    };
  });

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
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Track sales, check-ins, and revenue performance
                </p>
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedShowId} onValueChange={setSelectedShowId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by show" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shows</SelectItem>
                    {shows.map(show => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
                value: totalTickets.toLocaleString(),
                icon: Ticket,
                color: 'from-primary to-accent',
              },
              {
                label: 'Check-in Rate',
                value: `${checkInRate}%`,
                icon: CheckCircle,
                color: 'from-blue-500 to-blue-600',
              },
              {
                label: 'Unique Customers',
                value: uniqueCustomers.toLocaleString(),
                icon: Users,
                color: 'from-purple-500 to-purple-600',
              },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-6 rounded-2xl">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue by Show */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Revenue by Show
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueByShow.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByShow}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sales Over Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Sales Trend (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'sales' ? `₦${value.toLocaleString()}` : value,
                          name === 'sales' ? 'Revenue' : 'Tickets'
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={false}
                        name="Tickets"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Tier Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Ticket Tier Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No ticket data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Check-in Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Check-in Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalTickets > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={checkInData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No check-in data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;
