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
      const { data: failedOrder } = await supabase
        .from("orders")
        .select("seat_ids")
        .eq("reference", reference)
        .single();

      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("reference", reference);

      // Release reserved seats
      if (failedOrder?.seat_ids && failedOrder.seat_ids.length > 0) {
        await supabase
          .from("seats")
          .update({ status: "available", order_id: null })
          .in("id", failedOrder.seat_ids);
      }

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

    // Get the order with show and ticket tier details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        shows:show_id (title, date, time, venue),
        ticket_tiers:ticket_tier_id (name)
      `)
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

    // Generate QR code data string
    const qrCode = JSON.stringify({
      orderId: order.id,
      reference: order.reference,
    });

    // Update order status with QR code
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        qr_code: qrCode,
      })
      .eq("reference", reference);

    if (updateOrderError) {
      console.error("Error updating order:", updateOrderError);
      throw new Error("Failed to update order");
    }

    // Mark seats as sold and link to order
    if (order.seat_ids && order.seat_ids.length > 0) {
      const { error: seatUpdateError } = await supabase
        .from("seats")
        .update({ status: "sold", order_id: order.id })
        .in("id", order.seat_ids);

      if (seatUpdateError) {
        console.error("Error updating seats:", seatUpdateError);
      }
    }

    // Update ticket tier sold count (only for non-seat purchases)
    if (!order.seat_ids || order.seat_ids.length === 0) {
      const { error: rpcError } = await supabase
        .rpc('increment_ticket_sold', {
          tier_id: order.ticket_tier_id,
          quantity: order.quantity
        });

      if (rpcError) {
        console.error("Error incrementing ticket count:", rpcError);
        // We log but don't fail the verification as payment is already successful
      }
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", order.user_id)
      .single();

    // Get seat info for email
    let seatInfo = "";
    if (order.seat_ids && order.seat_ids.length > 0) {
      const { data: seats } = await supabase
        .from("seats")
        .select("row_label, seat_number")
        .in("id", order.seat_ids)
        .order("row_label")
        .order("seat_number");

      if (seats && seats.length > 0) {
        seatInfo = seats.map((s: { row_label: string; seat_number: number }) =>
          `${s.row_label}${s.seat_number}`
        ).join(", ");
      }
    }

    // Send confirmation email
    if (profile?.email && order.shows && order.ticket_tiers) {
      try {
        const emailPayload = {
          email: profile.email,
          customerName: profile.full_name || "Valued Customer",
          showTitle: order.shows.title,
          showDate: order.shows.date,
          showTime: order.shows.time,
          venue: order.shows.venue,
          ticketTier: order.ticket_tiers.name,
          quantity: order.quantity,
          totalAmount: order.total_amount,
          reference: order.reference,
          seatInfo: seatInfo || undefined,
        };

        console.log("Sending confirmation email with payload:", emailPayload);

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-ticket-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(emailPayload),
        });

        const emailResult = await emailResponse.json();
        console.log("Email send result:", emailResult);
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the payment verification if email fails
      }
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
