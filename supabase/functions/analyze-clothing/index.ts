import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    console.log('Analyzing clothing image');

    const systemPrompt = `You are a fashion cataloguing assistant. Look at the photo of a single clothing item and identify:
- category: exactly one of "tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"
- color: the dominant color, as a short Persian (Farsi) word or two (e.g. "آبی نفتی", "قرمز", "مشکی")
- name: a short, natural Persian name for the item (e.g. "پیراهن آبی", "شلوار جین")

Respond ONLY with a single JSON object, no markdown, no code fences, no extra text, in this exact shape:
{"category": "...", "color": "...", "name": "..."}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this clothing item.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'محدودیت درخواست، لطفا کمی صبر کنید' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'اعتبار کافی نیست' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI service error');
    }

    const data = await response.json();
    const rawText: string = data.choices?.[0]?.message?.content || '';

    // Be defensive: strip markdown code fences if the model added them anyway
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed: { category?: string; color?: string; name?: string } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', cleaned);
      throw new Error('Could not parse analysis result');
    }

    const category = VALID_CATEGORIES.includes(parsed.category || '') ? parsed.category : 'tops';

    console.log('Successfully analyzed clothing item:', { category, color: parsed.color, name: parsed.name });

    return new Response(JSON.stringify({
      category,
      color: parsed.color || '',
      name: parsed.name || '',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-clothing function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'خطا در تشخیص لباس',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
