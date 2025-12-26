import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useShows, useCreateShow, useUpdateShow, useDeleteShow } from '@/hooks/useShows';
import { ShowForm, ShowFormData } from '@/components/admin/ShowForm';
import { getShowStatus, Show } from '@/types/show';

const AdminShows = () => {
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
        if (confirm('Are you sure you want to delete this show? This will prevent future ticket sales.')) {
            deleteShow.mutate(showId);
        }
    };

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
                    <h1 className="font-display text-3xl font-bold text-foreground">Shows</h1>
                    <p className="text-muted-foreground">Manage your events and ticket tiers</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
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
                                <DialogTitle className="font-display text-2xl">Create New Show</DialogTitle>
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

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Show Details</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sales</th>
                                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShows.map((show) => {
                                const status = getShowStatus(show);
                                const ticketsSold = show.ticketTiers.reduce((s, t) => s + t.sold, 0);
                                const totalTickets = show.ticketTiers.reduce((s, t) => s + t.quantity, 0);
                                const revenue = show.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0);
                                const isPassed = status === 'passed';

                                return (
                                    <tr key={show.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={show.image}
                                                    alt={show.title}
                                                    className="w-12 h-12 rounded-lg object-cover bg-muted"
                                                />
                                                <div>
                                                    <p className="font-medium text-foreground">{show.title}</p>
                                                    <p className="text-xs text-muted-foreground">{show.category} • {show.venue}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col text-sm">
                                                <span className="text-foreground">{new Date(show.date).toLocaleDateString()}</span>
                                                <span className="text-muted-foreground text-xs">{show.time}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    status === 'soldout' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                }`}>
                                                {status === 'available' ? 'Active' : status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium">₦{revenue.toLocaleString()}</span>
                                                <span className="text-xs text-muted-foreground">{ticketsSold} / {totalTickets} sold</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={editingShow?.id === show.id} onOpenChange={(open) => !open && setEditingShow(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                            onClick={() => setEditingShow(show)}
                                                            disabled={isPassed} // Requirement: Passed shows cannot be edited
                                                        >
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
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No shows found matching your search.</p>
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

export default AdminShows;
