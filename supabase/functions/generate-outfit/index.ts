import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClothingItem {
  name: string;
  category: string;
  color?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clothes, selectedItemIds } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    console.log('Generating outfit suggestion for', clothes.length, 'items');

    // Build the prompt with clothing details
    const clothingList = clothes.map((item: ClothingItem) => 
      `- ${item.name} (${item.category}${item.color ? `, ${item.color}` : ''})`
    ).join('\n');

    const selectedInfo = selectedItemIds?.length > 0 
      ? `\n\nThe user has specifically selected these items to include in the outfit: ${selectedItemIds.join(', ')}`
      : '';

    const systemPrompt = `You are a professional fashion stylist AI. Your job is to suggest outfit combinations from the user's wardrobe.
    
Rules:
- Consider color coordination and style matching
- Suggest complete outfits (top + bottom + shoes when available)
- Explain why the combination works well
- Be encouraging and positive
- Respond in Persian (Farsi) language
- Keep suggestions practical and wearable`;

    const userPrompt = `Here are the clothes in my wardrobe:

${clothingList}
${selectedInfo}

Please suggest a stylish outfit combination from these items and explain why they work well together.`;

    console.log('Sending request to AI gateway');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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

    console.log('Successfully generated suggestion');

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-outfit function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'خطا در ایجاد پیشنهاد' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
