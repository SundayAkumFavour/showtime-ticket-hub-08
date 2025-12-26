import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Show } from '@/types/show';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

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

  const [uploading, setUploading] = useState(false);

  const handleTierChange = (index: number, field: string, value: string | number) => {
    const newTiers = [...formData.ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, ticketTiers: newTiers });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('show-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('show-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image: data.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
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

      <div className="grid grid-cols-1 gap-4">
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
          <Label>Show Image</Label>
          <div className="mt-2 flex items-center gap-4">
            {formData.image ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground transition-colors bg-muted/5">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 mb-2" />
                    )}
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Click to upload banner image'}</span>
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            )}
          </div>
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
            <div className="col-span-1">
              <Label className="text-xs mb-1 block">{tier.name}</Label>
              <Input value={tier.name} disabled />
            </div>
            <div className="col-span-1">
              <Label className="text-xs mb-1 block">Price (₦)</Label>
              <Input
                type="number"
                placeholder="0"
                value={tier.price || ''}
                onChange={(e) => handleTierChange(index, 'price', Number(e.target.value))}
              />
            </div>
            <div className="col-span-1">
              <Label className="text-xs mb-1 block">Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={tier.quantity || ''}
                onChange={(e) => handleTierChange(index, 'quantity', Number(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="gradient" className="flex-1" disabled={isLoading || uploading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Show' : 'Create Show'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
