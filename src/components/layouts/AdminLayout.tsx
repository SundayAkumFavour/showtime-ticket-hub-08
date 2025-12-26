import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    Users,
    BarChart3,
    Scan,
    LogOut,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const { signOut } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card fixed h-full hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-primary" />
                        <span className="font-display font-bold text-xl">ShowTime</span>
                    </Link>
                    <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Admin Portal
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <Link to="/admin/dashboard">
                        <Button
                            variant={isActive('/admin/dashboard') ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                    </Link>

                    <Link to="/admin/shows">
                        <Button
                            variant={isActive('/admin/shows') || isActive('/admin/shows/create') ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Shows
                        </Button>
                    </Link>

                    <Link to="/admin/orders">
                        <Button
                            variant={isActive('/admin/orders') ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <Ticket className="w-4 h-4 mr-2" />
                            Orders
                        </Button>
                    </Link>

                    <Link to="/admin/analytics">
                        <Button
                            variant={isActive('/admin/analytics') ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                        </Button>
                    </Link>

                    <Link to="/admin/users">
                        <Button
                            variant={isActive('/admin/users') ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Users
                        </Button>
                    </Link>

                    <Link to="/admin/scanner">
                        <Button
                            variant={isActive('/admin/scanner') ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <Scan className="w-4 h-4 mr-2" />
                            Scanner
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
};
