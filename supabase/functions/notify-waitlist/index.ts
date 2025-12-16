import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { showId } = await req.json();

    if (!showId) {
      throw new Error("Show ID is required");
    }

    console.log(`Notifying waitlist for show: ${showId}`);

    // Get show details
    const { data: show, error: showError } = await supabase
      .from("shows")
      .select("title, date, time, venue, location")
      .eq("id", showId)
      .single();

    if (showError || !show) {
      throw new Error("Show not found");
    }

    // Get waitlist entries that haven't been notified
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("waitlist")
      .select("*")
      .eq("show_id", showId)
      .eq("notified", false);

    if (waitlistError) {
      throw waitlistError;
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log("No waitlist entries to notify");
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${waitlistEntries.length} entries to notify`);

    const showDate = new Date(show.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let notifiedCount = 0;

    for (const entry of waitlistEntries) {
      try {
        await resend.emails.send({
          from: "Tickets <onboarding@resend.dev>",
          to: [entry.email],
          subject: `🎟️ Tickets Available: ${show.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">Great news! Tickets are now available!</h1>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Tickets for <strong>${show.title}</strong> are now available. You were on the waitlist for this event, so we're giving you first notice!
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">${show.title}</h2>
                <p style="color: #666; margin: 8px 0;">
                  📍 ${show.venue}, ${show.location}<br>
                  📅 ${showDate}<br>
                  ⏰ ${show.time}
                </p>
              </div>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Don't wait too long - tickets may sell out again!
              </p>
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                You received this email because you joined the waitlist for this event.
              </p>
            </div>
          `,
        });

        // Mark as notified
        await supabase
          .from("waitlist")
          .update({ notified: true, notified_at: new Date().toISOString() })
          .eq("id", entry.id);

        notifiedCount++;
        console.log(`Notified: ${entry.email}`);
      } catch (emailError) {
        console.error(`Failed to notify ${entry.email}:`, emailError);
      }
    }

    console.log(`Successfully notified ${notifiedCount} users`);

    return new Response(
      JSON.stringify({ success: true, notified: notifiedCount }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error notifying waitlist:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
