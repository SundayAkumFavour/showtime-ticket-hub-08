import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Ticket, DollarSign, Tag } from 'lucide-react';

interface PromoUsageData {
  promo_code_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  total_orders: number;
  total_savings: number;
}

export const PromoCodeAnalytics = () => {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['promo_code_analytics'],
    queryFn: async () => {
      // Get orders with promo codes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          promo_code_id,
          discount_amount,
          total_amount,
          payment_status,
          created_at,
          promo_codes (
            code,
            discount_type,
            discount_value
          )
        `)
        .not('promo_code_id', 'is', null)
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Aggregate by promo code
      const aggregated = (orders || []).reduce((acc, order) => {
        const promoId = order.promo_code_id;
        if (!promoId) return acc;

        if (!acc[promoId]) {
          acc[promoId] = {
            promo_code_id: promoId,
            code: (order.promo_codes as any)?.code || 'Unknown',
            discount_type: (order.promo_codes as any)?.discount_type || 'percentage',
            discount_value: (order.promo_codes as any)?.discount_value || 0,
            total_orders: 0,
            total_savings: 0,
          };
        }

        acc[promoId].total_orders += 1;
        acc[promoId].total_savings += order.discount_amount || 0;

        return acc;
      }, {} as Record<string, PromoUsageData>);

      return Object.values(aggregated);
    },
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['promo_recent_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          reference,
          total_amount,
          discount_amount,
          created_at,
          promo_codes (code)
        `)
        .not('promo_code_id', 'is', null)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const totalSavings = usageData?.reduce((sum, p) => sum + p.total_savings, 0) || 0;
  const totalOrders = usageData?.reduce((sum, p) => sum + p.total_orders, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Promo Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₦{totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders with Promos
            </CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Using {usageData?.length || 0} different codes
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Discount per Order
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₦{totalOrders > 0 ? Math.round(totalSavings / totalOrders).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Promo Code */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Usage by Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageData && usageData.length > 0 ? (
            <div className="space-y-4">
              {usageData.map((promo) => (
                <div key={promo.promo_code_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <span className="font-mono font-medium text-foreground">{promo.code}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₦${promo.discount_value}`})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {promo.total_orders} orders
                    </div>
                    <div className="text-xs text-primary">
                      ₦{promo.total_savings.toLocaleString()} saved
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No promo code usage yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders with Promo Codes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Recent Orders with Promo Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reference</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Promo Code</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Discount</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-sm font-mono text-foreground">{order.reference}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary">
                          {(order.promo_codes as any)?.code || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right text-primary">
                        -₦{(order.discount_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                        ₦{order.total_amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No orders with promo codes yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
