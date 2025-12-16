import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserWaitlistEntry, useJoinWaitlist, useLeaveWaitlist } from '@/hooks/useWaitlist';
import { useNavigate } from 'react-router-dom';

interface WaitlistButtonProps {
  showId: string;
  showTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const WaitlistButton = ({
  showId,
  showTitle,
  variant = 'outline',
  size = 'default',
  className,
}: WaitlistButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  const { data: waitlistEntry, isLoading: checkingWaitlist } = useUserWaitlistEntry(showId, user?.id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();

  const isOnWaitlist = !!waitlistEntry;

  const handleClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isOnWaitlist) {
      leaveWaitlist.mutate({ showId });
    } else {
      setEmail(user.email || '');
      setIsOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinWaitlist.mutate(
      { showId, email },
      { onSuccess: () => setIsOpen(false) }
    );
  };

  if (checkingWaitlist) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={isOnWaitlist ? 'ghost' : variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={joinWaitlist.isPending || leaveWaitlist.isPending}
      >
        {joinWaitlist.isPending || leaveWaitlist.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : isOnWaitlist ? (
          <BellOff className="w-4 h-4 mr-2" />
        ) : (
          <Bell className="w-4 h-4 mr-2" />
        )}
        {isOnWaitlist ? 'Leave Waitlist' : 'Join Waitlist'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Waitlist</DialogTitle>
            <DialogDescription>
              Get notified when tickets become available for "{showTitle}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={joinWaitlist.isPending}
            >
              {joinWaitlist.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Notify Me'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
