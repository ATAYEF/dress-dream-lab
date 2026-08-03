import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fallback chain: if a model hits a rate limit (429) or runs out of credits (402),
 * we automatically move on to the next model in the list.
 */
const FALLBACK_CHAIN = [
  'google/gemini-3.1-flash-image',
  'google/gemini-2.5-flash-image',
  'google/gemini-3.1-flash-lite-image',
  'google/gemini-3-pro-image',
  'openai/gpt-image-2',
  'openai/gpt-image-1-mini',
];

const ALLOWED_MODELS = FALLBACK_CHAIN;
const DEFAULT_MODEL = FALLBACK_CHAIN[0];

/** Build the ordered list of models to try, starting from the requested one. */
function buildChain(requested?: string): string[] {
  const start = ALLOWED_MODELS.includes(requested ?? '') ? requested! : DEFAULT_MODEL;
  return [start, ...FALLBACK_CHAIN.filter((m) => m !== start)];
}

// Models that are image-only (must use /v1/images/generations instead of chat completions)
const IMAGE_ONLY_MODELS = [
  'openai/gpt-image-2',
  'openai/gpt-image-1-mini',
  'google/gemini-3.1-flash-lite-image',
];
const isImageOnlyModel = (model: string) => IMAGE_ONLY_MODELS.includes(model);

type CallResult =
  | { ok: true; imageUrl: string }
  | { ok: false; status: number; retryable: boolean; message: string };

/** Gemini image models: OpenAI-compatible chat completions with image inputs. */
async function callChatModel(
  apiKey: string,
  model: string,
  content: unknown[],
): Promise<CallResult> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      status: response.status,
      retryable: response.status === 429 || response.status === 402 || response.status >= 500,
      message: errorText.slice(0, 500),
    };
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const b64 = data.data?.[0]?.b64_json;
  const imageUrl =
    message?.images?.[0]?.image_url?.url ||
    (typeof b64 === 'string' ? `data:image/png;base64,${b64}` : null);

  if (!imageUrl) {
    return { ok: false, status: 502, retryable: true, message: 'No image in response' };
  }
  return { ok: true, imageUrl };
}

/** OpenAI image models: image-only endpoint (/v1/images/generations), text prompt driven. */
async function callImageModel(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<CallResult> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      status: response.status,
      retryable: response.status === 429 || response.status === 402 || response.status >= 500,
      message: errorText.slice(0, 500),
    };
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;
  const imageUrl = typeof b64 === 'string' ? `data:image/png;base64,${b64}` : (url ?? null);

  if (!imageUrl) {
    return { ok: false, status: 502, retryable: true, message: 'No image in response' };
  }
  return { ok: true, imageUrl };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseImageUrl, mannequinImageUrl, isUserPhoto, clothingItems, suggestedFootwear, suggestedAccessory, model } = await req.json();

    // Backward compatible: older clients may still send `mannequinImageUrl`.
    const resolvedBaseImageUrl = baseImageUrl || mannequinImageUrl;
    const chain = buildChain(model);

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

    console.log('Virtual try-on chain:', chain.join(' -> '), 'items:', clothingItems.length, 'base:', isUserPhoto ? 'user photo' : 'mannequin');

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

    // Build content array with base image and clothing images (chat models)
    const content: any[] = [
      { type: "text", text: promptText },
      { type: "image_url", image_url: { url: resolvedBaseImageUrl } },
    ];

    const itemsDescription: string[] = [];
    for (const item of clothingItems) {
      content.push({ type: "text", text: `Clothing item: ${item.name} (${item.category})` });
      content.push({ type: "image_url", image_url: { url: item.imageUrl } });
      itemsDescription.push(`${item.name} (${item.category})`);
    }

    // Text-only fallback prompt for image-only models (no reference images supported)
    const textOnlyPrompt = `${promptText}

The outfit consists of: ${itemsDescription.join(', ')}.
Render a full-body, photorealistic fashion image of a ${isUserPhoto ? 'person' : 'store mannequin'} wearing this outfit on a clean neutral studio background.`;

    const attempts: { model: string; status: number; message: string }[] = [];

    for (const candidate of chain) {
      console.log('Trying model:', candidate);
      const result = isImageOnlyModel(candidate)
        ? await callImageModel(LOVABLE_API_KEY, candidate, textOnlyPrompt)
        : await callChatModel(LOVABLE_API_KEY, candidate, content);

      if (result.ok) {
        console.log('Successfully generated virtual try-on image with', candidate);
        return new Response(JSON.stringify({
          imageUrl: result.imageUrl,
          model: candidate,
          fallbackUsed: candidate !== chain[0],
          attempts,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.error('Model failed:', candidate, result.status, result.message);
      attempts.push({ model: candidate, status: result.status, message: result.message });

      if (!result.retryable) {
        // Non-retryable error (bad request etc.) — no point trying other models with the same payload
        break;
      }
    }

    // Every model in the chain failed
    const allRateLimited = attempts.length > 0 && attempts.every((a) => a.status === 429);
    const allOutOfCredits = attempts.some((a) => a.status === 402);
    const lastStatus = allOutOfCredits ? 402 : allRateLimited ? 429 : (attempts[attempts.length - 1]?.status ?? 500);

    const errorMessage = allRateLimited
      ? 'همه مدل‌ها در حال حاضر محدودیت درخواست دارند، لطفا کمی صبر کنید'
      : allOutOfCredits
        ? 'اعتبار هوش مصنوعی کافی نیست (همه مدل‌های جایگزین هم امتحان شدند)'
        : 'ساخت تصویر با هیچ‌کدام از مدل‌ها ممکن نشد';

    return new Response(JSON.stringify({ error: errorMessage, attempts }), {
      status: lastStatus === 402 || lastStatus === 429 ? lastStatus : 500,
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
