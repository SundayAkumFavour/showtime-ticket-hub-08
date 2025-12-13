import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckInRequest {
  orderId: string;
  reference: string;
  markAsCheckedIn?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, reference, markAsCheckedIn = false }: CheckInRequest = await req.json();

    console.log("Check-in request:", { orderId, reference, markAsCheckedIn });

    // Fetch the order with show and ticket tier details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        show:shows(id, title, venue, location, date, time, image),
        ticket_tier:ticket_tiers(id, name, price)
      `)
      .eq("id", orderId)
      .eq("reference", reference)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ success: false, error: "Ticket not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if payment is completed
    if (order.payment_status !== "completed") {
      return new Response(
        JSON.stringify({ success: false, error: "Ticket payment not completed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if show date has passed (with some grace period)
    const showDate = new Date(order.show.date);
    const now = new Date();
    const dayAfterShow = new Date(showDate);
    dayAfterShow.setDate(dayAfterShow.getDate() + 1);

    if (now > dayAfterShow) {
      return new Response(
        JSON.stringify({ success: false, error: "Event has already passed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If markAsCheckedIn is true, update the order
    if (markAsCheckedIn) {
      if (order.checked_in) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Ticket already checked in",
            checked_in_at: order.checked_in_at 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to check in" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Successfully checked in:", orderId);
    }

    // Get seat information if available
    let seatInfo = null;
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

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          reference: order.reference,
          quantity: order.quantity,
          total_amount: order.total_amount,
          checked_in: markAsCheckedIn ? true : order.checked_in,
          checked_in_at: markAsCheckedIn ? new Date().toISOString() : order.checked_in_at,
          show: order.show,
          ticket_tier: order.ticket_tier,
          seat_info: seatInfo,
        },
        message: markAsCheckedIn ? "Successfully checked in!" : "Ticket valid",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Check-in error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
