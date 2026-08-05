import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const imageUrl = body?.imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageUrl الزامی است" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
    if (!REMOVE_BG_API_KEY) {
      console.error("REMOVE_BG_API_KEY missing");
      return new Response(
        JSON.stringify({
          error: "سرویس حذف پس‌زمینه پیکربندی نشده است",
          code: "NOT_CONFIGURED",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const form = new FormData();
    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      const base64 = parts[1];
      if (!base64) {
        return new Response(JSON.stringify({ error: "data URL نامعتبر" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      form.append("image_file", new Blob([binary], { type: "image/jpeg" }), "garment.jpg");
    } else {
      form.append("image_url", imageUrl);
    }
    form.append("size", "auto");
    form.append("format", "png");
    form.append("crop", "false");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("remove.bg error", res.status, errText.slice(0, 500));
      let message = "حذف پس‌زمینه آنلاین ناموفق بود";
      if (res.status === 402 || res.status === 429) {
        message = "سقف اعتبار remove.bg تمام شده است";
      } else if (res.status === 403) {
        message = "کلید remove.bg نامعتبر است";
      }
      return new Response(JSON.stringify({ error: message, status: res.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    // chunked btoa for large images
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const outUrl = `data:image/png;base64,${btoa(binary)}`;

    console.log("remove.bg ok, bytes", buf.length);
    return new Response(JSON.stringify({ imageUrl: outUrl, provider: "remove.bg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("remove-bg exception", e);
    return new Response(JSON.stringify({ error: "خطای داخلی حذف پس‌زمینه" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
