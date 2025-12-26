import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Shows from "./pages/Shows";
import ShowDetail from "./pages/ShowDetail";
import Dashboard from "./pages/Dashboard";
import OrderHistory from "./pages/OrderHistory";
import TicketScanner from "./pages/TicketScanner";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PaymentVerify from "./pages/PaymentVerify";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShows from "./pages/admin/AdminShows";
import AdminShowCreate from "./pages/admin/AdminShowCreate";
import AdminShowEdit from "./pages/admin/AdminShowEdit";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminRevenue from "./pages/admin/AdminRevenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/shows" element={<Shows />} />
            <Route path="/show/:id" element={<ShowDetail />} />
            <Route path="/payment/verify" element={<PaymentVerify />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* User protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            
            {/* Admin protected routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/shows" element={<ProtectedRoute requireAdmin><AdminShows /></ProtectedRoute>} />
            <Route path="/admin/shows/create" element={<ProtectedRoute requireAdmin><AdminShowCreate /></ProtectedRoute>} />
            <Route path="/admin/shows/:id/edit" element={<ProtectedRoute requireAdmin><AdminShowEdit /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/revenue" element={<ProtectedRoute requireAdmin><AdminRevenue /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
            <Route path="/admin/scanner" element={<ProtectedRoute requireAdmin><TicketScanner /></ProtectedRoute>} />
            <Route path="/admin/manage" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
