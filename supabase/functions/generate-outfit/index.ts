import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClothingItem {
  id?: string;
  name: string;
  category: string;
  color?: string;
  tags?: string[];
}

interface OutfitContext {
  style?: 'formal' | 'party' | 'casual';
  environment?: 'office' | 'gathering';
  weather?: 'sunny' | 'rainy' | 'cold';
}

const STYLE_FA: Record<string, string> = {
  formal: 'رسمی',
  party: 'مهمانی',
  casual: 'روزمره',
};

const ENV_FA: Record<string, string> = {
  office: 'اداری',
  gathering: 'دورهمی',
};

const WEATHER_FA: Record<string, string> = {
  sunny: 'آفتابی',
  rainy: 'بارانی',
  cold: 'سرد',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'احراز هویت الزامی است' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'احراز هویت نامعتبر' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const clothes: ClothingItem[] = body.clothes || [];
    const selectedItemIds: string[] = body.selectedItemIds || [];
    const context: OutfitContext = body.context || {};

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    const style = context.style || 'casual';
    const environment = context.environment || 'gathering';
    const weather = context.weather || 'sunny';

    const clothingList = clothes
      .map((item) => {
        const tags = item.tags?.length ? `, tags: ${item.tags.join('/')}` : '';
        const idPart = item.id ? ` [id=${item.id}]` : '';
        return `- ${item.name}${idPart} (${item.category}${item.color ? `, ${item.color}` : ''}${tags})`;
      })
      .join('\n');

    const selectedInfo =
      selectedItemIds.length > 0
        ? `\n\nPreferred / selected item ids to prioritize in the outfit: ${selectedItemIds.join(', ')}`
        : '';

    const contextBlock = `
Occasion context (MUST follow):
- Style / dress code: ${style} (${STYLE_FA[style] || style})
- Environment: ${environment} (${ENV_FA[environment] || environment})
- Weather: ${weather} (${WEATHER_FA[weather] || weather})

Rules for context:
- formal + office → polished, modest, professional; avoid flashy party pieces
- party + gathering → elevated, stylish, statement-friendly
- casual → comfortable everyday wear
- cold → prefer layers, outerwear, closed shoes when available in wardrobe
- rainy → prefer outerwear and practical shoes when available
- sunny → lighter layers; avoid heavy coats unless needed for formal look
ONLY recommend items that appear in the wardrobe list below.
`;

    const systemPrompt = `You are a professional fashion stylist AI for a Persian-speaking user.
Your job is to suggest ONE complete outfit from the user's digital wardrobe that fits the given style, environment, and weather.

Rules:
- Only use items from the provided wardrobe
- Respect style (formal / party / casual), environment (office / gathering), and weather (sunny / rainy / cold)
- Prefer color coordination
- Prefer complete outfits (e.g. top+bottom+shoes, or dress+shoes, plus outerwear when weather needs it)
- Explain briefly why this set fits the occasion
- Respond entirely in Persian (Farsi)
- Keep the answer practical and wearable
- Mention the occasion labels in Persian in your opening sentence`;

    const userPrompt = `کمد لباس من:

${clothingList}
${selectedInfo}

${contextBlock}

لطفاً یک ست کامل و مناسب از همین لباس‌ها برای این شرایط پیشنهاد بده و دلیل هماهنگی را کوتاه توضیح بده.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
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
    const suggestion = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-outfit function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'خطا در ایجاد پیشنهاد',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
