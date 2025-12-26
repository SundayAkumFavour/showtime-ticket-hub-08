import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaystackInitRequest {
  email: string;
  amount: number; // in kobo
  showId: string;
  ticketTierId: string;
  quantity: number;
  callback_url: string;
  seatIds?: string[];
  promoCodeId?: string;
  discountAmount?: number;
}

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

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const body: PaystackInitRequest = await req.json();
    const { email, amount, showId, ticketTierId, quantity, callback_url, seatIds, promoCodeId, discountAmount } = body;

    // Validate the ticket tier exists and has enough quantity
    const { data: tier, error: tierError } = await supabase
      .from("ticket_tiers")
      .select("*, shows (date, time)")
      .eq("id", ticketTierId)
      .single();

    if (tierError || !tier) {
      throw new Error("Ticket tier not found");
    }

    // Check if show has passed
    if (tier.shows) {
      // @ts-ignore
      const showDateTime = new Date(`${tier.shows.date}T${tier.shows.time}`);
      if (showDateTime < new Date()) {
        throw new Error("This show has passed and cannot accept new purchases");
      }
    }

    // If seatIds provided, validate seats are available
    if (seatIds && seatIds.length > 0) {
      const { data: seats, error: seatsError } = await supabase
        .from("seats")
        .select("id, status")
        .in("id", seatIds);

      if (seatsError) {
        throw new Error("Failed to validate seats");
      }

      const unavailableSeats = seats?.filter(s => s.status !== "available") || [];
      if (unavailableSeats.length > 0) {
        throw new Error("Some selected seats are no longer available");
      }

      // Reserve the seats temporarily
      const { error: reserveError } = await supabase
        .from("seats")
        .update({ status: "reserved" })
        .in("id", seatIds);

      if (reserveError) {
        console.error("Error reserving seats:", reserveError);
        throw new Error("Failed to reserve seats");
      }
    } else {
      // Non-seat based purchase - check tier availability
      const availableQuantity = tier.quantity - tier.sold;
      if (quantity > availableQuantity) {
        throw new Error(`Only ${availableQuantity} tickets available`);
      }
    }

    // Generate unique reference
    const reference = `SH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create pending order with seat_ids and promo code
    const { error: orderError } = await supabase.from("orders").insert({
      user_id: user.id,
      show_id: showId,
      ticket_tier_id: ticketTierId,
      quantity,
      total_amount: amount / 100, // Convert from kobo to naira
      payment_status: "pending",
      reference,
      seat_ids: seatIds || [],
      promo_code_id: promoCodeId || null,
      discount_amount: discountAmount || 0,
    });

    if (orderError) {
      console.error("Order creation error:", orderError);
      // Unreserve seats if order creation fails
      if (seatIds && seatIds.length > 0) {
        await supabase
          .from("seats")
          .update({ status: "available" })
          .in("id", seatIds);
      }
      throw new Error("Failed to create order");
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        callback_url,
        metadata: {
          order_reference: reference,
          show_id: showId,
          ticket_tier_id: ticketTierId,
          quantity,
          user_id: user.id,
          seat_ids: seatIds || [],
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack response:", paystackData);

    if (!paystackData.status) {
      // Delete the pending order if Paystack fails
      await supabase.from("orders").delete().eq("reference", reference);
      // Unreserve seats
      if (seatIds && seatIds.length > 0) {
        await supabase
          .from("seats")
          .update({ status: "available" })
          .in("id", seatIds);
      }
      throw new Error(paystackData.message || "Failed to initialize payment");
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        access_code: paystackData.data.access_code,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-initialize:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
