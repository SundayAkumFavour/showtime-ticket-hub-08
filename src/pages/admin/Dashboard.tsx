import { motion } from 'framer-motion';
import { DollarSign, Ticket, Users, Calendar } from 'lucide-react';
import { useShows } from '@/hooks/useShows';
import { getShowStatus } from '@/types/show';

const AdminDashboard = () => {
    const { data: shows = [], isLoading } = useShows();

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
    const activeShows = shows.filter((s) => getShowStatus(s) === 'available').length;

    const stats = [
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
            label: 'Active Shows',
            value: activeShows,
            icon: Calendar,
            color: 'from-blue-500 to-indigo-500',
        },
        {
            label: 'Sold Out',
            value: soldOutShows,
            icon: Users,
            color: 'from-amber-500 to-orange-500',
        },
    ];

    if (isLoading) {
        return <div className="p-8">Loading stats...</div>;
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's what's happening with your events.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${stat.color} blur-2xl w-32 h-32 rounded-full -mr-16 -mt-16`} />

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4 shadow-lg shadow-black/5`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>

                        <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity or Quick Acts could go here */}
        </div>
    );
};

export default AdminDashboard;
