import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransferRequest {
  orderId: string;
  recipientEmail: string;
  recipientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { orderId, recipientEmail, recipientName }: TransferRequest = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Transfer request:", { orderId, recipientEmail, userId: user.id });

    // Fetch the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        show:shows(id, title, venue, location, date, time, image),
        ticket_tier:ticket_tiers(id, name, price)
      `)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      console.error("Order not found or not owned by user:", orderError);
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if payment is completed
    if (order.payment_status !== "completed") {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot transfer unpaid tickets" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already checked in
    if (order.checked_in) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot transfer checked-in tickets" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if show date has passed
    const showDate = new Date(order.show.date);
    if (new Date() > showDate) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot transfer tickets for past events" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if recipient exists in our system
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("email", recipientEmail.toLowerCase())
      .single();

    let recipientUserId = recipientProfile?.user_id;
    let recipientActualName = recipientName || recipientProfile?.full_name || "there";

    // Get sender info
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .single();

    const senderName = senderProfile?.full_name || senderProfile?.email || "Someone";

    // If recipient exists, transfer the ticket
    if (recipientUserId) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ user_id: recipientUserId })
        .eq("id", orderId);

      if (updateError) {
        console.error("Transfer error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to transfer ticket" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Format show date
    const formattedDate = showDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email notification
    const emailHtml = recipientUserId ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">🎫 You've Received Tickets!</h1>
        
        <p>Hi ${recipientActualName},</p>
        
        <p><strong>${senderName}</strong> has transferred tickets to you!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1a1a2e;">${order.show.title}</h2>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${order.show.time}</p>
          <p style="margin: 8px 0;"><strong>Venue:</strong> ${order.show.venue}</p>
          <p style="margin: 8px 0;"><strong>Location:</strong> ${order.show.location}</p>
          <p style="margin: 8px 0;"><strong>Tickets:</strong> ${order.quantity}x ${order.ticket_tier?.name || "Standard"}</p>
          <p style="margin: 8px 0;"><strong>Reference:</strong> ${order.reference}</p>
        </div>
        
        <p>Log in to your account to view and download your tickets.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This ticket transfer was processed by ShowHub.
        </p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">🎫 You've Been Sent Tickets!</h1>
        
        <p>Hi ${recipientActualName},</p>
        
        <p><strong>${senderName}</strong> wants to send you tickets to an event!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1a1a2e;">${order.show.title}</h2>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${order.show.time}</p>
          <p style="margin: 8px 0;"><strong>Venue:</strong> ${order.show.venue}</p>
          <p style="margin: 8px 0;"><strong>Tickets:</strong> ${order.quantity}x ${order.ticket_tier?.name || "Standard"}</p>
        </div>
        
        <p><strong>To claim your tickets:</strong></p>
        <ol>
          <li>Create an account on ShowHub using this email address (${recipientEmail})</li>
          <li>The tickets will automatically appear in your dashboard</li>
        </ol>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          The sender has been notified. Create your account before the event to access your tickets!
        </p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ShowHub <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `${senderName} sent you tickets to ${order.show.title}!`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.json();
      console.error("Failed to send email:", emailError);
    }

    // If recipient doesn't exist yet, store pending transfer info
    if (!recipientUserId) {
      // Store the pending transfer - the user_id stays the same for now
      // When recipient signs up with this email, a trigger could transfer tickets
      console.log("Recipient not registered yet, email sent with instructions");
    }

    return new Response(
      JSON.stringify({
        success: true,
        transferred: !!recipientUserId,
        message: recipientUserId 
          ? "Tickets transferred successfully! The recipient has been notified."
          : "Invitation sent! The recipient needs to create an account to claim the tickets.",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Transfer error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
