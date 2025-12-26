import { UserManagement } from '@/components/admin/UserManagement';

const AdminUsers = () => {
    return (
        <div className="space-y-6">
            <h1 className="font-display text-3xl font-bold text-foreground">User Management</h1>
            <UserManagement />
        </div>
    );
}

export default AdminUsers;
