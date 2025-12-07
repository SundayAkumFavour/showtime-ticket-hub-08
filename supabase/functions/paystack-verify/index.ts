import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reference } = await req.json();

    if (!reference) {
      throw new Error("Reference is required");
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();
    console.log("Paystack verification response:", paystackData);

    if (!paystackData.status || paystackData.data.status !== "success") {
      // Update order to failed
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("reference", reference);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment verification failed",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("reference", reference)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Check if already processed
    if (order.payment_status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already verified",
          order,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update order status
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ payment_status: "completed" })
      .eq("reference", reference);

    if (updateOrderError) {
      console.error("Error updating order:", updateOrderError);
      throw new Error("Failed to update order");
    }

    // Update ticket tier sold count
    const { data: tier, error: tierError } = await supabase
      .from("ticket_tiers")
      .select("sold")
      .eq("id", order.ticket_tier_id)
      .single();

    if (!tierError && tier) {
      await supabase
        .from("ticket_tiers")
        .update({ sold: tier.sold + order.quantity })
        .eq("id", order.ticket_tier_id);
    }

    console.log("Payment verified successfully for reference:", reference);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        order: { ...order, payment_status: "completed" },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-verify:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
