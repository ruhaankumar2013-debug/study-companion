import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  changes: Array<{
    title: string;
    message: string;
    category: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, changes }: NotificationRequest = await req.json();

    if (!userId || !changes || changes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No changes to notify' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's notification email from sync_status
    const { data: syncStatus } = await supabase
      .from('sync_status')
      .select('notification_email')
      .eq('user_id', userId)
      .maybeSingle();

    if (!syncStatus?.notification_email) {
      console.log('No notification email configured for user:', userId);
      return new Response(
        JSON.stringify({ success: false, error: 'No notification email configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = syncStatus.notification_email;
    
    // Build email content
    const changesHtml = changes.map(change => `
      <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #7c3aed;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${change.title}</h3>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">${change.message}</p>
        <span style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #e9d5ff; color: #7c3aed; border-radius: 4px; font-size: 12px;">${change.category.replace(/_/g, ' ')}</span>
      </div>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "Veracross Updates <onboarding@resend.dev>",
      to: [email],
      subject: `🔔 ${changes.length} New Update${changes.length > 1 ? 's' : ''} from Veracross`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          </style>
        </head>
        <body style="background: #f3f4f6; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">🦉 Veracross Dashboard</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">New updates detected!</p>
            </div>
            <div style="padding: 24px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                Hey there! We found <strong>${changes.length} new update${changes.length > 1 ? 's' : ''}</strong> on your Veracross portal:
              </p>
              ${changesHtml}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                You're receiving this because you enabled email notifications.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
