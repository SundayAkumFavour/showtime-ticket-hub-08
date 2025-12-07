import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminUsers, usePromoteToAdmin, useDemoteFromAdmin } from '@/hooks/useAdminUsers';
import { Search, Shield, ShieldOff, User, Loader2 } from 'lucide-react';

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useAdminUsers();
  const promoteToAdmin = usePromoteToAdmin();
  const demoteFromAdmin = useDemoteFromAdmin();

  const filteredUsers = (users || []).filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          User Management ({users?.length || 0})
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        {user.full_name || 'No name'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{user.email || 'N/A'}</td>
                  <td className="p-4">
                    <span
                      className={`status-badge ${
                        user.role === 'admin' ? 'status-soldout' : 'status-available'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end">
                      {user.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => demoteFromAdmin.mutate(user.user_id)}
                          disabled={demoteFromAdmin.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <ShieldOff className="w-4 h-4 mr-2" />
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => promoteToAdmin.mutate(user.user_id)}
                          disabled={promoteToAdmin.isPending}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No users found
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
