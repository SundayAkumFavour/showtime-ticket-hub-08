import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketEmailRequest {
  email: string;
  customerName: string;
  showTitle: string;
  showDate: string;
  showTime: string;
  venue: string;
  ticketTier: string;
  quantity: number;
  totalAmount: number;
  reference: string;
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

    const {
      email,
      customerName,
      showTitle,
      showDate,
      showTime,
      venue,
      ticketTier,
      quantity,
      totalAmount,
      reference,
    }: TicketEmailRequest = await req.json();

    console.log("Sending ticket confirmation email to:", email);

    const formattedDate = new Date(showDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; color: #ffffff; }
          .content { padding: 30px; }
          .ticket-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
          .ticket-detail { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
          .ticket-detail:last-child { border-bottom: none; }
          .label { color: #888; font-size: 14px; display: block; }
          .value { color: #fff; font-weight: 600; font-size: 16px; }
          .total { background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); border-radius: 8px; padding: 15px 20px; margin-top: 20px; text-align: center; }
          .total .value { font-size: 24px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .reference { background: #0a0a0a; padding: 10px; border-radius: 6px; text-align: center; font-family: monospace; color: #e94560; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Ticket Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName || "there"},</p>
            <p>Your tickets have been successfully purchased. Here are your booking details:</p>
            
            <div class="ticket-box">
              <div class="ticket-detail">
                <span class="label">Event</span>
                <span class="value">${showTitle}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Date</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Time</span>
                <span class="value">${showTime}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Venue</span>
                <span class="value">${venue}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Ticket Type</span>
                <span class="value">${ticketTier}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Quantity</span>
                <span class="value">${quantity} ticket(s)</span>
              </div>
            </div>
            
            <div class="total">
              <span class="label" style="color: rgba(255,255,255,0.8);">Total Paid</span>
              <span class="value">₦${totalAmount.toLocaleString()}</span>
            </div>
            
            <div class="reference">
              Reference: ${reference}
            </div>
            
            <p style="margin-top: 30px; color: #888;">Please save this email as your ticket confirmation. Present this reference number at the venue.</p>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tickets <onboarding@resend.dev>",
        to: [email],
        subject: `Your tickets for ${showTitle} - Confirmed!`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending ticket email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
