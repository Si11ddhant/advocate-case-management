import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886"; // Twilio standard sandbox number
const ADVOCATE_PHONE_NUMBER = Deno.env.get("ADVOCATE_PHONE_NUMBER") || ""; // Target recipient number e.g. whatsapp:+1234567890

serve(async () => {
  try {
    // 1. Initialize Supabase Service Role client to bypass RLS for cron checks
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in Edge environment variables.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Compute date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 3. Fetch dockets scheduled for tomorrow
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*, clients(*)')
      .eq('next_hearing_date', tomorrowStr);

    if (error) throw error;

    if (!cases || cases.length === 0) {
      return new Response(JSON.stringify({ message: "No hearings scheduled for tomorrow." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4. Construct high-readability WhatsApp Text layout
    let messageText = `*⚖️ Advocate ERP Alert: Tomorrow's Hearings (${tomorrowStr})*\n\n`;
    cases.forEach((c: any, index: number) => {
      messageText += `${index + 1}. *${c.case_title}*\n`;
      messageText += `   • Docket No: ${c.case_number || 'N/A'}\n`;
      messageText += `   • Court: ${c.court_name || 'N/A'}\n`;
      messageText += `   • Client Name: ${c.clients?.name || 'N/A'}\n\n`;
    });
    messageText += `_Please ensure briefs, arguments, and evidence files are fully ready._`;

    // 5. Send message via Twilio HTTP Client
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !ADVOCATE_PHONE_NUMBER) {
      throw new Error("Missing Twilio credentials or Advocate phone configuration.");
    }

    const authString = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const bodyParams = new URLSearchParams({
      From: TWILIO_WHATSAPP_NUMBER,
      To: ADVOCATE_PHONE_NUMBER,
      Body: messageText,
    });

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    const twilioData = await twilioRes.json();
    if (!twilioRes.ok) {
      throw new Error(twilioData.message || `Twilio dispatch failed: ${twilioRes.status}`);
    }

    return new Response(JSON.stringify({ success: true, messageSid: twilioData.sid }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
