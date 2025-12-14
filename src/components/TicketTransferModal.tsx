import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const transferSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  name: z.string().trim().max(100).optional(),
});

interface TicketTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  showTitle: string;
  ticketCount: number;
}

export const TicketTransferModal = ({
  isOpen,
  onClose,
  orderId,
  showTitle,
  ticketCount,
}: TicketTransferModalProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  const handleTransfer = async () => {
    // Validate input
    const result = transferSchema.safeParse({ email, name: name || undefined });
    
    if (!result.success) {
      const fieldErrors: { email?: string; name?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'name') fieldErrors.name = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('transfer-ticket', {
        body: {
          orderId,
          recipientEmail: email.trim().toLowerCase(),
          recipientName: name.trim() || undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(data.message);
        onClose();
        setEmail('');
        setName('');
      } else {
        toast.error(data.error || 'Failed to transfer ticket');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error.message || 'Failed to transfer ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Transfer Tickets</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">You're transferring:</p>
            <p className="font-semibold text-foreground">{ticketCount} ticket(s) to {showTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Recipient Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friend's name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            If the recipient has an account, the tickets will be transferred immediately.
            Otherwise, they'll receive an email with instructions to create an account.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleTransfer}
              disabled={isLoading || !email.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
