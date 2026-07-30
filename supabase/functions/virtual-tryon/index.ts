import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mannequinImageUrl, clothingItems, suggestedFootwear, suggestedAccessory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    if (!clothingItems || clothingItems.length === 0) {
      throw new Error('No clothing items provided');
    }

    console.log('Virtual try-on for', clothingItems.length, 'items');

    // Build content array with mannequin and clothing images
    const content: any[] = [
      {
        type: "text",
        text: `You are a virtual fashion styling assistant. Create a realistic composite image showing a mannequin wearing the following clothing items naturally. 
        
Instructions:
- Take the mannequin base image and realistically dress it with the provided clothing items
- Position each clothing item appropriately on the mannequin body (tops on torso, bottoms on legs, shoes on feet, etc.)
- Make the clothing look natural and fitted, as if the mannequin is actually wearing them
- Maintain proper proportions and realistic fabric draping
- The result should look like a professional fashion store mannequin display

- Keep the mannequin's face and hair from the base image intact and attractive
${suggestedFootwear ? `- The user did not choose any shoes. Add ${suggestedFootwear} on the feet so the look is complete and well matched to the outfit.` : ''}
${suggestedAccessory ? `- The user did not choose any accessory. Add ${suggestedAccessory} so the styling looks complete and coordinated.` : ''}

Generate a single realistic image of the dressed mannequin.`
      },
      {
        type: "image_url",
        image_url: {
          url: mannequinImageUrl
        }
      }
    ];

    // Add each clothing item image
    for (const item of clothingItems) {
      content.push({
        type: "text",
        text: `Clothing item: ${item.name} (${item.category})`
      });
      content.push({
        type: "image_url",
        image_url: {
          url: item.imageUrl
        }
      });
    }

    console.log('Sending request to AI gateway for image generation');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        modalities: ["image", "text"]
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
    console.log('AI response received');
    
    // Extract the generated image
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('Failed to generate image');
    }

    console.log('Successfully generated virtual try-on image');

    return new Response(JSON.stringify({ 
      imageUrl: generatedImage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in virtual-tryon function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'خطا در ایجاد تصویر' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
