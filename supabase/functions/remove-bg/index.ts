import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageUrl الزامی است" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
    if (!REMOVE_BG_API_KEY) {
      return new Response(
        JSON.stringify({ error: "سرویس حذف پس‌زمینه آنلاین پیکربندی نشده است", code: "NOT_CONFIGURED" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const form = new FormData();
    if (imageUrl.startsWith("data:")) {
      const base64 = imageUrl.split(",")[1];
      const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      form.append("image_file", new Blob([binary]), "garment.jpg");
    } else {
      form.append("image_url", imageUrl);
    }
    form.append("size", "auto");
    form.append("format", "png");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("remove.bg error", res.status, errText);
      let message = "حذف پس‌زمینه آنلاین ناموفق بود";
      if (res.status === 402 || res.status === 429) {
        message = "سقف اعتبار سرویس حذف پس‌زمینه تمام شده است";
      }
      return new Response(JSON.stringify({ error: message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const outUrl = `data:image/png;base64,${btoa(binary)}`;

    return new Response(JSON.stringify({ imageUrl: outUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "خطای داخلی حذف پس‌زمینه" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
