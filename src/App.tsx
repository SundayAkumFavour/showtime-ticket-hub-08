import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Standard pages
const Index = lazy(() => import("./pages/Index"));
const Shows = lazy(() => import("./pages/Shows"));
const ShowDetail = lazy(() => import("./pages/ShowDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const TicketScanner = lazy(() => import("./pages/TicketScanner"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentVerify = lazy(() => import("./pages/PaymentVerify"));

// Admin pages
const AdminLayout = lazy(() => import("@/components/layouts/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminShows = lazy(() => import("./pages/admin/AdminShows"));
const AdminShowCreate = lazy(() => import("./pages/admin/AdminShowCreate"));
const AdminShowEdit = lazy(() => import("./pages/admin/AdminShowEdit"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
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
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shows"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminShows />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shows/create"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminShowCreate />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shows/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminShowEdit />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminOrders />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/scanner"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <TicketScanner />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/revenue"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminRevenue />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <Analytics />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
