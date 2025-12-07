import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Show } from '@/types/show';

interface ShowFormProps {
  initialData?: Show;
  onSubmit: (data: ShowFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ShowFormData {
  title: string;
  description: string;
  image: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  category: string;
  featured: boolean;
  ticketTiers: {
    name: string;
    price: number;
    quantity: number;
    description: string;
  }[];
}

const DEFAULT_TIERS = [
  { name: 'Regular', price: 0, quantity: 0, description: 'Standard admission' },
  { name: 'Golden', price: 0, quantity: 0, description: 'Premium seating with refreshments' },
  { name: 'Platinum', price: 0, quantity: 0, description: 'VIP area access with exclusive perks' },
  { name: 'VIP', price: 0, quantity: 0, description: 'Ultimate experience with backstage access' },
];

export const ShowForm = ({ initialData, onSubmit, onCancel, isLoading }: ShowFormProps) => {
  const [formData, setFormData] = useState<ShowFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    location: initialData?.location || '',
    venue: initialData?.venue || '',
    date: initialData?.date ? initialData.date.split('T')[0] : '',
    time: initialData?.time || '',
    category: initialData?.category || '',
    featured: initialData?.featured || false,
    ticketTiers: initialData?.ticketTiers?.map((t) => ({
      name: t.name,
      price: t.price,
      quantity: t.quantity,
      description: t.description,
    })) || DEFAULT_TIERS,
  });

  const handleTierChange = (index: number, field: string, value: string | number) => {
    const newTiers = [...formData.ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, ticketTiers: newTiers });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Show Title</Label>
        <Input
          id="title"
          placeholder="Enter show title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter show description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="venue">Venue</Label>
          <Input
            id="venue"
            placeholder="Venue name"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="City, Country"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="Music, Comedy, etc."
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            placeholder="https://..."
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="featured"
          checked={formData.featured}
          onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
        />
        <Label htmlFor="featured">Featured show</Label>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="font-semibold text-foreground mb-3">Ticket Tiers</h4>
        {formData.ticketTiers.map((tier, index) => (
          <div key={tier.name} className="grid grid-cols-3 gap-2 mb-2">
            <Input placeholder={tier.name} disabled value={tier.name} />
            <Input
              type="number"
              placeholder="Price (₦)"
              value={tier.price || ''}
              onChange={(e) => handleTierChange(index, 'price', Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={tier.quantity || ''}
              onChange={(e) => handleTierChange(index, 'quantity', Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="gradient" className="flex-1" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Show' : 'Create Show'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
