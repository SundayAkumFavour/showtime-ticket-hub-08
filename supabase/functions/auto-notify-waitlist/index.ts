import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  showId: string;
  tierName?: string;
  availableCount?: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: NotifyRequest = await req.json();
    const { showId, tierName, availableCount } = body;

    console.log(`Processing waitlist notification for show ${showId}`);

    // Get show details
    const { data: show, error: showError } = await supabase
      .from("shows")
      .select("id, title, venue, location, date, time")
      .eq("id", showId)
      .single();

    if (showError || !show) {
      console.error("Show not found:", showError);
      throw new Error("Show not found");
    }

    // Get waitlist entries that haven't been notified
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("waitlist")
      .select("id, user_id, email")
      .eq("show_id", showId)
      .eq("notified", false);

    if (waitlistError) {
      console.error("Error fetching waitlist:", waitlistError);
      throw waitlistError;
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log("No waitlist entries to notify");
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${waitlistEntries.length} waitlist entries to notify`);

    const showDate = new Date(show.date);
    const formattedDate = showDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let notifiedCount = 0;
    const errors: string[] = [];

    for (const entry of waitlistEntries) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ShowHub <onboarding@resend.dev>",
            to: [entry.email],
            subject: `🎉 Tickets Now Available: ${show.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px; border-radius: 16px;">
                <h1 style="color: #a855f7; margin-bottom: 20px;">Great News! Tickets Are Available! 🎭</h1>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  You're on the waitlist for <strong>${show.title}</strong>, and we're excited to let you know that tickets are now available!
                </p>
                
                <div style="background: #2d2d44; padding: 24px; border-radius: 12px; margin: 24px 0;">
                  <h2 style="margin-top: 0; color: #ffffff; font-size: 20px;">${show.title}</h2>
                  <p style="margin: 8px 0; color: #a1a1aa;"><strong style="color: #ffffff;">📅 Date:</strong> ${formattedDate}</p>
                  <p style="margin: 8px 0; color: #a1a1aa;"><strong style="color: #ffffff;">🕐 Time:</strong> ${show.time}</p>
                  <p style="margin: 8px 0; color: #a1a1aa;"><strong style="color: #ffffff;">📍 Venue:</strong> ${show.venue}, ${show.location}</p>
                  ${tierName ? `<p style="margin: 8px 0; color: #a1a1aa;"><strong style="color: #ffffff;">🎫 Available:</strong> ${tierName}${availableCount ? ` (${availableCount} tickets)` : ''}</p>` : ''}
                </div>
                
                <p style="font-size: 14px; color: #a1a1aa;">
                  ⚡ <strong style="color: #ffffff;">Act fast!</strong> These tickets may sell out quickly. Don't miss your chance to attend this amazing event!
                </p>
                
                <p style="color: #71717a; font-size: 12px; margin-top: 30px;">
                  You received this email because you joined the waitlist for this show on ShowHub.
                </p>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          // Mark as notified
          await supabase
            .from("waitlist")
            .update({ notified: true, notified_at: new Date().toISOString() })
            .eq("id", entry.id);
          
          notifiedCount++;
          console.log(`Notified ${entry.email}`);
        } else {
          const errorData = await emailResponse.json();
          console.error(`Failed to notify ${entry.email}:`, errorData);
          errors.push(`Failed to email ${entry.email}`);
        }
      } catch (emailError: any) {
        console.error(`Failed to notify ${entry.email}:`, emailError);
        errors.push(`Failed to email ${entry.email}: ${emailError.message}`);
      }
    }

    console.log(`Successfully notified ${notifiedCount}/${waitlistEntries.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: notifiedCount,
        total: waitlistEntries.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in auto-notify-waitlist:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
