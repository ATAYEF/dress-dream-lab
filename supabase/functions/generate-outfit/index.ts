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

    const contextBlock = `مناسبت: ${STYLE_FA[style] || style} | محیط: ${ENV_FA[environment] || environment} | هوا: ${WEATHER_FA[weather] || weather}`;

    const systemPrompt = `استایلیست فارسی. از لباس‌های داده‌شده یک ست مناسب بساز.
قوانین: فقط همان لباس‌ها؛ رعایت مناسبت/محیط/هوا؛ کوتاه (۳–۵ جمله)؛ فارسی روان.`;

    const userPrompt = `کمد لباس من:

${clothingList}
${selectedInfo}

${contextBlock}

لطفاً یک ست کامل و مناسب از همین لباس‌ها برای این شرایط پیشنهاد بده و دلیل هماهنگی را کوتاه توضیح بده.`;

    // Prefer free/fast text models; fall back when rate-limited or out of credits
    // Cheapest text models first; avoid premium chat models for styling copy
    const TEXT_MODEL_CHAIN = [
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-flash',
      'google/gemini-3-flash',
    ];

    let suggestion: string | undefined;
    let lastStatus = 0;
    let lastErrorText = '';

    for (const model of TEXT_MODEL_CHAIN) {
      console.log('generate-outfit trying model:', model);
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        suggestion = data.choices?.[0]?.message?.content;
        if (suggestion) break;
        lastStatus = 502;
        lastErrorText = 'empty suggestion';
        continue;
      }

      lastStatus = response.status;
      lastErrorText = await response.text();
      console.error('AI gateway error:', model, response.status, lastErrorText);

      // Retry next model on rate limit / payment required / server errors
      if (response.status === 429 || response.status === 402 || response.status >= 500) {
        continue;
      }
      // Non-retryable
      break;
    }

    if (!suggestion) {
      if (lastStatus === 429) {
        return new Response(JSON.stringify({ error: 'محدودیت درخواست، لطفا کمی صبر کنید' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (lastStatus === 402) {
        return new Response(JSON.stringify({ error: 'اعتبار کافی نیست' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI service error');
    }

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
