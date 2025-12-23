import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShows } from '@/hooks/useShows';
import { useWaitlistForShow } from '@/hooks/useWaitlist';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Loader2, Users, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const WaitlistManager = () => {
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  
  const { data: waitlistEntries = [], isLoading: waitlistLoading } = useWaitlistForShow(selectedShowId);

  const handleNotifyWaitlist = async () => {
    if (!selectedShowId) {
      toast.error('Please select a show first');
      return;
    }

    const unnotifiedCount = waitlistEntries.filter(e => !e.notified).length;
    if (unnotifiedCount === 0) {
      toast.info('No users to notify on the waitlist');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-waitlist', {
        body: { showId: selectedShowId }
      });

      if (error) throw error;

      toast.success(`Notifications sent to ${data?.notified || unnotifiedCount} users`);
    } catch (error: any) {
      console.error('Error notifying waitlist:', error);
      toast.error('Failed to send notifications');
    } finally {
      setIsSending(false);
    }
  };

  const selectedShow = shows.find(s => s.id === selectedShowId);
  const unnotifiedCount = waitlistEntries.filter(e => !e.notified).length;
  const notifiedCount = waitlistEntries.filter(e => e.notified).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Waitlist Notifications
          </CardTitle>
          <CardDescription>
            Manually notify users on the waitlist when tickets become available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Show</label>
            <Select value={selectedShowId} onValueChange={setSelectedShowId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a show..." />
              </SelectTrigger>
              <SelectContent>
                {shows.map((show) => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.title} - {new Date(show.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedShowId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {waitlistLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Waitlist</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{waitlistEntries.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Pending Notifications</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{unnotifiedCount}</p>
                    </div>
                  </div>

                  {unnotifiedCount > 0 ? (
                    <Button
                      onClick={handleNotifyWaitlist}
                      disabled={isSending}
                      className="w-full"
                      variant="gradient"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Notifications...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Notify {unnotifiedCount} Users
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/30 text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {waitlistEntries.length === 0 
                          ? 'No users on the waitlist for this show'
                          : 'All waitlist users have been notified'}
                      </span>
                    </div>
                  )}

                  {notifiedCount > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {notifiedCount} user{notifiedCount !== 1 ? 's' : ''} already notified
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
