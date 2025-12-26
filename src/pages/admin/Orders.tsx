import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';

// Define the shape of the data returned by the query
type OrderWithRelations = Tables<'orders'> & {
    shows: Pick<Tables<'shows'>, 'title' | 'date'> | null;
    ticket_tiers: Pick<Tables<'ticket_tiers'>, 'name'> | null;
    profiles: Pick<Tables<'profiles'>, 'full_name' | 'email'> | null;
};

const AdminOrders = () => {
    const [search, setSearch] = useState('');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          shows (title, date),
          ticket_tiers (name),
          profiles (full_name, email)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as OrderWithRelations[];
        },
    });

    const filteredOrders = orders.filter((order) => {
        const searchLower = search.toLowerCase();
        return (
            order.reference.toLowerCase().includes(searchLower) ||
            order.profiles?.email?.toLowerCase().includes(searchLower) ||
            order.profiles?.full_name?.toLowerCase().includes(searchLower) ||
            order.shows?.title.toLowerCase().includes(searchLower)
        );
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Orders</h1>
                    <p className="text-muted-foreground">View and manage ticket sales</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order Ref</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Show</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ticket</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                                    <td className="p-4 font-mono text-xs">{order.reference}</td>
                                    <td className="p-4 text-sm">
                                        {order.profiles?.full_name || 'Guest'}
                                        <span className="block text-xs text-muted-foreground">
                                            {order.profiles?.email || 'No email'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-foreground font-medium">
                                        {order.shows?.title || 'Unknown Show'}
                                        <span className="block text-xs text-muted-foreground">
                                            {order.shows?.date ? new Date(order.shows.date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {order.quantity}x {order.ticket_tiers?.name || 'Ticket'}
                                    </td>
                                    <td className="p-4 text-sm font-medium">₦{order.total_amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${order.payment_status === 'completed'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-destructive/10 text-destructive'
                                                }`}
                                        >
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
