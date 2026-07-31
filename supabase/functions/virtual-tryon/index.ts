import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MODELS = [
  'google/gemini-3.1-flash-image',
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image',
];
const DEFAULT_MODEL = 'google/gemini-3.1-flash-image';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseImageUrl, mannequinImageUrl, isUserPhoto, clothingItems, suggestedFootwear, suggestedAccessory, model } = await req.json();

    // Backward compatible: older clients may still send `mannequinImageUrl`.
    const resolvedBaseImageUrl = baseImageUrl || mannequinImageUrl;
    const resolvedModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    if (!clothingItems || clothingItems.length === 0) {
      throw new Error('No clothing items provided');
    }

    if (!resolvedBaseImageUrl) {
      throw new Error('No base image provided');
    }

    console.log('Virtual try-on with model', resolvedModel, 'for', clothingItems.length, 'items. Using', isUserPhoto ? 'real user photo' : 'generic mannequin');


    // Build the instruction prompt: if we have a real photo of the user, the
    // whole point is to show THEM wearing the outfit (preserving identity),
    // not a generic mannequin.
    const promptText = isUserPhoto
      ? `You are a virtual fashion styling assistant doing a realistic virtual try-on. The base image is a REAL PHOTO of a real person.

Instructions:
- Keep the exact same person: same face, same identity, same hair, same body shape, same pose, same background
- Realistically replace/dress their outfit with the provided clothing items only
- Position each clothing item appropriately on the person's body (tops on torso, bottoms on legs, shoes on feet, etc.)
- Make the clothing look natural and correctly fitted to their actual body, with realistic fabric draping, shadows and lighting consistent with the original photo
- Do not change the person's face, skin tone, or identity in any way
${suggestedFootwear ? `- No shoes were chosen. Add ${suggestedFootwear} on the feet so the look is complete and well matched to the outfit.` : ''}
${suggestedAccessory ? `- No accessory was chosen. Add ${suggestedAccessory} so the styling looks complete and coordinated.` : ''}

Generate a single realistic photo of this same person wearing the new outfit.`
      : `You are a virtual fashion styling assistant. Create a realistic composite image showing a mannequin wearing the following clothing items naturally. 
        
Instructions:
- Take the mannequin base image and realistically dress it with the provided clothing items
- Position each clothing item appropriately on the mannequin body (tops on torso, bottoms on legs, shoes on feet, etc.)
- Make the clothing look natural and fitted, as if the mannequin is actually wearing them
- Maintain proper proportions and realistic fabric draping
- The result should look like a professional fashion store mannequin display

- Keep the mannequin's face and hair from the base image intact and attractive
${suggestedFootwear ? `- The user did not choose any shoes. Add ${suggestedFootwear} on the feet so the look is complete and well matched to the outfit.` : ''}
${suggestedAccessory ? `- The user did not choose any accessory. Add ${suggestedAccessory} so the styling looks complete and coordinated.` : ''}

Generate a single realistic image of the dressed mannequin.`;

    // Build content array with base image and clothing images
    const content: any[] = [
      {
        type: "text",
        text: promptText
      },
      {
        type: "image_url",
        image_url: {
          url: resolvedBaseImageUrl
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
        model: resolvedModel,
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
