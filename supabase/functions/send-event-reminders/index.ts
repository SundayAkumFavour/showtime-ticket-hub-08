import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find shows happening in the next 24-25 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log(`Checking for shows between ${in24Hours.toISOString()} and ${in25Hours.toISOString()}`);

    // Get shows happening in the reminder window
    const { data: upcomingShows, error: showsError } = await supabaseClient
      .from("shows")
      .select("id, title, venue, location, date, time")
      .gte("date", in24Hours.toISOString())
      .lt("date", in25Hours.toISOString());

    if (showsError) {
      console.error("Error fetching shows:", showsError);
      throw showsError;
    }

    console.log(`Found ${upcomingShows?.length || 0} shows needing reminders`);

    if (!upcomingShows || upcomingShows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No shows needing reminders", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const show of upcomingShows) {
      // Get all confirmed orders for this show
      const { data: orders, error: ordersError } = await supabaseClient
        .from("orders")
        .select(`
          id,
          reference,
          quantity,
          user_id,
          seat_ids,
          ticket_tiers (name, price)
        `)
        .eq("show_id", show.id)
        .eq("payment_status", "completed");

      if (ordersError) {
        console.error(`Error fetching orders for show ${show.id}:`, ordersError);
        errors.push(`Failed to fetch orders for ${show.title}`);
        continue;
      }

      console.log(`Found ${orders?.length || 0} orders for show: ${show.title}`);

      for (const order of orders || []) {
        // Get user profile for email
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", order.user_id)
          .single();

        if (profileError || !profile?.email) {
          console.error(`No email found for user ${order.user_id}`);
          continue;
        }

        // Get seat info if applicable
        let seatInfo = "";
        if (order.seat_ids && order.seat_ids.length > 0) {
          const { data: seats } = await supabaseClient
            .from("seats")
            .select("row_label, seat_number")
            .in("id", order.seat_ids);
          
          if (seats && seats.length > 0) {
            seatInfo = seats.map(s => `Row ${s.row_label}, Seat ${s.seat_number}`).join(", ");
          }
        }

        const showDate = new Date(show.date);
        const formattedDate = showDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ShowHub <onboarding@resend.dev>",
              to: [profile.email],
              subject: `Reminder: ${show.title} is tomorrow!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1a1a2e;">Your Show is Tomorrow! 🎭</h1>
                  
                  <p>Hi ${profile.full_name || "there"},</p>
                  
                  <p>This is a friendly reminder that <strong>${show.title}</strong> is happening tomorrow!</p>
                  
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0; color: #1a1a2e;">${show.title}</h2>
                    <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
                    <p style="margin: 8px 0;"><strong>Time:</strong> ${show.time}</p>
                    <p style="margin: 8px 0;"><strong>Venue:</strong> ${show.venue}</p>
                    <p style="margin: 8px 0;"><strong>Location:</strong> ${show.location}</p>
                    ${seatInfo ? `<p style="margin: 8px 0;"><strong>Your Seats:</strong> ${seatInfo}</p>` : ""}
                    <p style="margin: 8px 0;"><strong>Tickets:</strong> ${order.quantity}x ${(order as any).ticket_tiers?.name || "Standard"}</p>
                    <p style="margin: 8px 0;"><strong>Reference:</strong> ${order.reference}</p>
                  </div>
                  
                  <p><strong>Important reminders:</strong></p>
                  <ul>
                    <li>Arrive at least 30 minutes before showtime</li>
                    <li>Have your QR code ticket ready for scanning</li>
                    <li>Check the venue's entry requirements</li>
                  </ul>
                  
                  <p>We hope you have an amazing time!</p>
                  
                  <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    This is an automated reminder from ShowHub.
                  </p>
                </div>
              `,
            }),
          });

          if (emailResponse.ok) {
            emailsSent++;
            console.log(`Reminder sent to ${profile.email} for ${show.title}`);
          } else {
            const emailError = await emailResponse.json();
            console.error(`Failed to send reminder to ${profile.email}:`, emailError);
            errors.push(`Failed to email ${profile.email}`);
          }
        } catch (emailError: any) {
          console.error(`Failed to send reminder to ${profile.email}:`, emailError);
          errors.push(`Failed to email ${profile.email}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Reminders processed`, 
        emailsSent,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
