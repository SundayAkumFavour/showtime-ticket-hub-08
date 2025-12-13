import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVenueLayouts, useCreateVenueLayout, useGenerateSeatsForShow, RowConfig } from '@/hooks/useSeats';
import { useShows } from '@/hooks/useShows';
import { Plus, Trash2, Loader2, LayoutGrid, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TIER_OPTIONS = ['Regular', 'Golden', 'Platinum', 'VIP'] as const;

export const VenueLayoutManager = () => {
  const { data: layouts = [], isLoading: layoutsLoading } = useVenueLayouts();
  const { data: shows = [] } = useShows();
  const createLayout = useCreateVenueLayout();
  const generateSeats = useGenerateSeatsForShow();

  const [isCreating, setIsCreating] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [rows, setRows] = useState<RowConfig[]>([
    { label: 'A', seats: 10, tier_id: undefined },
  ]);

  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('');

  const addRow = () => {
    const nextLabel = String.fromCharCode(65 + rows.length); // A, B, C, ...
    setRows([...rows, { label: nextLabel, seats: 10, tier_id: undefined }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, updates: Partial<RowConfig>) => {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...updates } : row)));
  };

  const handleCreateLayout = async () => {
    if (!layoutName.trim() || !venueName.trim()) {
      toast.error('Please enter layout and venue names');
      return;
    }

    if (rows.length === 0) {
      toast.error('Please add at least one row');
      return;
    }

    try {
      await createLayout.mutateAsync({
        name: layoutName,
        venue_name: venueName,
        rows_config: rows,
      });
      toast.success('Layout created successfully!');
      setIsCreating(false);
      setLayoutName('');
      setVenueName('');
      setRows([{ label: 'A', seats: 10, tier_id: undefined }]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create layout');
    }
  };

  const handleApplyLayout = async () => {
    if (!selectedShowId || !selectedLayoutId) {
      toast.error('Please select a show and layout');
      return;
    }

    try {
      await generateSeats.mutateAsync({
        showId: selectedShowId,
        layoutId: selectedLayoutId,
      });
      toast.success('Seating layout applied to show!');
      setSelectedShowId('');
      setSelectedLayoutId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply layout');
    }
  };

  const getTotalSeats = () => rows.reduce((sum, row) => sum + row.seats, 0);

  return (
    <div className="space-y-6">
      {/* Apply Layout to Show */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Apply Layout to Show
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Show</Label>
              <Select value={selectedShowId} onValueChange={setSelectedShowId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a show" />
                </SelectTrigger>
                <SelectContent>
                  {shows.map((show) => (
                    <SelectItem key={show.id} value={show.id}>
                      {show.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Layout</Label>
              <Select value={selectedLayoutId} onValueChange={setSelectedLayoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a layout" />
                </SelectTrigger>
                <SelectContent>
                  {layouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.id}>
                      {layout.name} ({layout.venue_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleApplyLayout}
            disabled={!selectedShowId || !selectedLayoutId || generateSeats.isPending}
          >
            {generateSeats.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Apply Layout
          </Button>
        </CardContent>
      </Card>

      {/* Existing Layouts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Venue Layouts</CardTitle>
          <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Cancel' : 'New Layout'}
          </Button>
        </CardHeader>
        <CardContent>
          {layoutsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : layouts.length === 0 && !isCreating ? (
            <p className="text-muted-foreground text-center py-8">
              No layouts created yet. Create one to enable seat selection for shows.
            </p>
          ) : (
            <div className="space-y-4">
              {isCreating && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Layout Name</Label>
                      <Input
                        value={layoutName}
                        onChange={(e) => setLayoutName(e.target.value)}
                        placeholder="e.g., Main Hall Standard"
                      />
                    </div>
                    <div>
                      <Label>Venue Name</Label>
                      <Input
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="e.g., Eko Convention Center"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Rows Configuration</Label>
                      <span className="text-sm text-muted-foreground">
                        Total: {getTotalSeats()} seats
                      </span>
                    </div>
                    <div className="space-y-2">
                      {rows.map((row, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-16">
                            <Input
                              value={row.label}
                              onChange={(e) => updateRow(index, { label: e.target.value })}
                              placeholder="Row"
                              className="text-center"
                            />
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              value={row.seats}
                              onChange={(e) => updateRow(index, { seats: parseInt(e.target.value) || 1 })}
                              placeholder="Seats"
                            />
                          </div>
                          <Select
                            value={row.tier_id || 'none'}
                            onValueChange={(v) => updateRow(index, { tier_id: v === 'none' ? undefined : v })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Tier</SelectItem>
                              {TIER_OPTIONS.map((tier) => (
                                <SelectItem key={tier} value={tier}>
                                  {tier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(index)}
                            disabled={rows.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateLayout} disabled={createLayout.isPending}>
                      {createLayout.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Create Layout
                    </Button>
                  </div>
                </motion.div>
              )}

              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{layout.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {layout.venue_name} • {layout.rows_config.length} rows •{' '}
                      {layout.rows_config.reduce((sum, r) => sum + r.seats, 0)} seats
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {layout.rows_config.slice(0, 3).map((row) => (
                      <span
                        key={row.label}
                        className="text-xs bg-muted px-2 py-1 rounded"
                      >
                        {row.label}: {row.seats}
                      </span>
                    ))}
                    {layout.rows_config.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{layout.rows_config.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
