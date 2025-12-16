import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, Tag, Percent, DollarSign } from 'lucide-react';
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
  PromoCode,
} from '@/hooks/usePromoCodes';
import { useShows } from '@/hooks/useShows';

interface PromoFormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  show_id: string | null;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

const defaultFormData: PromoFormData = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  max_uses: null,
  show_id: null,
  min_purchase_amount: 0,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: null,
  is_active: true,
};

export const PromoCodeManager = () => {
  const { data: promoCodes = [], isLoading } = usePromoCodes();
  const { data: shows = [] } = useShows();
  const createPromo = useCreatePromoCode();
  const updatePromo = useUpdatePromoCode();
  const deletePromo = useDeletePromoCode();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoFormData>(defaultFormData);

  const handleCreate = () => {
    createPromo.mutate(formData, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData(defaultFormData);
      },
    });
  };

  const handleUpdate = () => {
    if (!editingPromo) return;
    updatePromo.mutate(
      { id: editingPromo.id, ...formData },
      {
        onSuccess: () => {
          setEditingPromo(null);
          setFormData(defaultFormData);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      deletePromo.mutate(id);
    }
  };

  const openEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      max_uses: promo.max_uses,
      show_id: promo.show_id,
      min_purchase_amount: promo.min_purchase_amount,
      valid_from: promo.valid_from.split('T')[0],
      valid_until: promo.valid_until?.split('T')[0] || null,
      is_active: promo.is_active,
    });
    setEditingPromo(promo);
  };

  const PromoForm = ({ onSubmit, isLoading: submitting }: { onSubmit: () => void; isLoading: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Code</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., SUMMER20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Discount Type</label>
          <Select
            value={formData.discount_type}
            onValueChange={(v) => setFormData({ ...formData, discount_type: v as 'percentage' | 'fixed' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(₦)'}
          </label>
          <Input
            type="number"
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
            min={0}
            max={formData.discount_type === 'percentage' ? 100 : undefined}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Max Uses (optional)</label>
          <Input
            type="number"
            value={formData.max_uses || ''}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })}
            placeholder="Unlimited"
            min={1}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Description (optional)</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Summer sale discount"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Restrict to Show (optional)</label>
          <Select
            value={formData.show_id || 'all'}
            onValueChange={(v) => setFormData({ ...formData, show_id: v === 'all' ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All shows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              {shows.map((show) => (
                <SelectItem key={show.id} value={show.id}>
                  {show.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Min Purchase (₦)</label>
          <Input
            type="number"
            value={formData.min_purchase_amount}
            onChange={(e) => setFormData({ ...formData, min_purchase_amount: Number(e.target.value) })}
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Valid From</label>
          <Input
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Valid Until (optional)</label>
          <Input
            type="date"
            value={formData.valid_until || ''}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || null })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Active</label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <Button
        variant="gradient"
        className="w-full"
        onClick={onSubmit}
        disabled={!formData.code || !formData.discount_value || submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving...
          </>
        ) : editingPromo ? (
          'Update Promo Code'
        ) : (
          'Create Promo Code'
        )}
      </Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Promo Codes ({promoCodes.length})
        </h2>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setFormData(defaultFormData);
        }}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-5 h-5 mr-2" />
              Add Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
            </DialogHeader>
            <PromoForm onSubmit={handleCreate} isLoading={createPromo.isPending} />
          </DialogContent>
        </Dialog>
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Code</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Discount</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usage</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Validity</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((promo) => (
                  <tr key={promo.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-mono font-medium text-foreground">{promo.code}</span>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {promo.discount_type === 'percentage' ? (
                          <>
                            <Percent className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{promo.discount_value}%</span>
                          </>
                        ) : (
                          <>
                            <span className="text-foreground">₦{promo.discount_value.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">
                      {promo.current_uses} / {promo.max_uses || '∞'}
                    </td>
                    <td className="p-4">
                      <span className={`status-badge ${promo.is_active ? 'status-available' : 'status-passed'}`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(promo.valid_from).toLocaleDateString()}
                      {promo.valid_until && ` - ${new Date(promo.valid_until).toLocaleDateString()}`}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog open={editingPromo?.id === promo.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingPromo(null);
                            setFormData(defaultFormData);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(promo)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Promo Code</DialogTitle>
                            </DialogHeader>
                            <PromoForm onSubmit={handleUpdate} isLoading={updatePromo.isPending} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(promo.id)}
                          disabled={deletePromo.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No promo codes yet. Create your first promo code!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
