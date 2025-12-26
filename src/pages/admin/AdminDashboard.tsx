import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminStats, useDailyRevenue, useRevenueByShow } from '@/hooks/useAdminAnalytics';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Ticket,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader2,
  BarChart3,
  Package,
  Scan,
  Plus,
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
} from 'recharts';

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: dailyRevenue = [], isLoading: dailyLoading } = useDailyRevenue(14);
  const { data: revenueByShow = [], isLoading: showsLoading } = useRevenueByShow();

  const isLoading = statsLoading || dailyLoading || showsLoading;

  const topShows = revenueByShow.slice(0, 5);

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

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      change: '+12.5%',
    },
    {
      label: 'Tickets Sold',
      value: (stats?.totalTicketsSold || 0).toLocaleString(),
      icon: Ticket,
      color: 'from-primary to-accent',
      change: '+8.2%',
    },
    {
      label: 'Active Shows',
      value: stats?.activeShows || 0,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Sold Out Shows',
      value: stats?.soldOutShows || 0,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Passed Shows',
      value: stats?.passedShows || 0,
      icon: Clock,
      color: 'from-slate-500 to-slate-600',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Unique Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'from-pink-500 to-rose-500',
    },
    {
      label: 'Avg Order Value',
      value: `₦${(stats?.avgOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: BarChart3,
      color: 'from-cyan-500 to-teal-500',
    },
  ];

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
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Overview of your ticketing platform performance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/admin/shows/create">
                  <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Show
                  </Button>
                </Link>
                <Link to="/admin/scanner">
                  <Button variant="outline">
                    <Scan className="w-4 h-4 mr-2" />
                    Scanner
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="glass-card p-5 rounded-2xl"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Revenue Trend (14 Days)
                  </CardTitle>
                  <Link to="/admin/revenue">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dailyRevenue}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Shows by Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Top Shows by Revenue
                  </CardTitle>
                  <Link to="/admin/shows">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {topShows.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topShows} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number" 
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis 
                          dataKey="title" 
                          type="category" 
                          width={120}
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No revenue data yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Link to="/admin/shows">
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold text-foreground">Manage Shows</p>
                  <p className="text-sm text-muted-foreground">Create, edit, delete</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/orders">
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Package className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold text-foreground">View Orders</p>
                  <p className="text-sm text-muted-foreground">All transactions</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/revenue">
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold text-foreground">Revenue Analytics</p>
                  <p className="text-sm text-muted-foreground">Detailed reports</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/analytics">
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold text-foreground">Analytics</p>
                  <p className="text-sm text-muted-foreground">Charts & insights</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
