import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyRevenue, useRevenueByShow, useAdminStats } from '@/hooks/useAdminAnalytics';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Calendar,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const AdminRevenue = () => {
  const [period, setPeriod] = useState<number>(30);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: dailyRevenue = [], isLoading: dailyLoading } = useDailyRevenue(period);
  const { data: revenueByShow = [], isLoading: showsLoading } = useRevenueByShow();

  const isLoading = statsLoading || dailyLoading || showsLoading;

  // Calculate period comparison
  const totalPeriodRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalPeriodTickets = dailyRevenue.reduce((sum, d) => sum + d.tickets, 0);
  const totalPeriodOrders = dailyRevenue.reduce((sum, d) => sum + d.orders, 0);

  // Revenue distribution by show (top 6)
  const topShowsForPie = revenueByShow.slice(0, 6);
  const pieData = topShowsForPie.map((show) => ({
    name: show.title.length > 20 ? show.title.slice(0, 20) + '...' : show.title,
    value: show.revenue,
  }));

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
                  Revenue Analytics
                </h1>
                <p className="text-muted-foreground">
                  Detailed revenue breakdown and insights
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[7, 14, 30, 90].map((days) => (
                  <Button
                    key={days}
                    variant={period === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₦{(stats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Calendar className="w-4 h-4" />
                Last {period} Days
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₦{totalPeriodRevenue.toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                Period Tickets
              </div>
              <p className="text-2xl font-bold text-foreground">
                {totalPeriodTickets}
              </p>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <BarChart3 className="w-4 h-4" />
                Period Orders
              </div>
              <p className="text-2xl font-bold text-foreground">
                {totalPeriodOrders}
              </p>
            </div>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Daily Revenue (Last {period} Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyRevenue}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => value.slice(5)}
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
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorRev)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Revenue by Show
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
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
                          formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Revenue by Show Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Breakdown by Show</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Show</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByShow.map((show, index) => (
                      <TableRow key={show.showId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">#{index + 1}</span>
                            <span className="font-medium">{show.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(show.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">{show.orders}</TableCell>
                        <TableCell className="text-right">{show.tickets}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{show.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₦{Math.round(show.revenue / show.orders).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {revenueByShow.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No revenue data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminRevenue;
