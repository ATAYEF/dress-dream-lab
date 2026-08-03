/**
 * Map Supabase Edge Function failures to short Persian messages.
 * Default client error is English: "Edge Function returned a non-2xx status code".
 */

const CREDIT_RE =
  /402|payment|credit|quota|insufficient|اعتبار|out of credits|Payment Required/i;
const RATE_RE = /429|rate limit|too many|محدودیت|Resource exhausted/i;
const AUTH_RE = /401|403|jwt|unauthorized|not authenticated|Invalid JWT/i;
const SIZE_RE = /payload|too large|body|413|request entity/i;

export function persianEdgeError(
  error: unknown,
  data?: { error?: string; message?: string } | null
): string {
  // Prefer structured body from the function
  if (data && typeof data === 'object') {
    const msg = (data as any).error || (data as any).message;
    if (typeof msg === 'string' && msg.trim() && !/non-2xx|Edge Function/i.test(msg)) {
      return msg.trim();
    }
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  // Supabase FunctionsHttpError may expose context as Response
  const ctx = (error as any)?.context;
  if (ctx && typeof ctx === 'object') {
    // status on Response
    const status = (ctx as Response).status || (error as any)?.status;
    if (status === 402 || CREDIT_RE.test(raw)) {
      return 'اعتبار هوش مصنوعی تمام شده است. لطفاً بعداً دوباره تلاش کنید یا اعتبار حساب را شارژ کنید.';
    }
    if (status === 429 || RATE_RE.test(raw)) {
      return 'تعداد درخواست‌ها زیاد است. چند لحظه صبر کنید و دوباره تلاش کنید.';
    }
    if (status === 401 || status === 403 || AUTH_RE.test(raw)) {
      return 'برای استفاده از پرو مجازی وارد حساب کاربری شوید.';
    }
  }

  if (CREDIT_RE.test(raw) || /402/.test(raw)) {
    return 'اعتبار هوش مصنوعی کافی نیست. همه مدل‌های جایگزین هم بدون اعتبار بودند.';
  }
  if (RATE_RE.test(raw) || /429/.test(raw)) {
    return 'سرویس موقتاً شلوغ است. لطفاً کمی بعد دوباره تلاش کنید.';
  }
  if (AUTH_RE.test(raw)) {
    return 'برای پرو مجازی لطفاً وارد حساب خود شوید.';
  }
  if (SIZE_RE.test(raw)) {
    return 'حجم تصاویر زیاد است. تعداد لباس‌ها را کم کنید یا عکس سبک‌تری انتخاب کنید.';
  }
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.';
  }
  if (/non-2xx|Edge Function returned/i.test(raw)) {
    return 'سرویس تصویرسازی در دسترس نیست یا اعتبار مدل‌ها تمام شده است. کمی بعد دوباره تلاش کنید.';
  }
  if (raw && !/Edge Function/i.test(raw) && raw.length < 180) {
    return raw;
  }
  return 'ساخت تصویر ممکن نشد. لطفاً دوباره تلاش کنید.';
}

/**
 * Invoke helper: read JSON body even on non-2xx when client exposes context.
 */
export async function readFunctionErrorBody(error: unknown): Promise<{
  error?: string;
  message?: string;
} | null> {
  try {
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.json === 'function') {
      return await ctx.json();
    }
    if (ctx && typeof ctx.text === 'function') {
      const text = await ctx.text();
      try {
        return JSON.parse(text);
      } catch {
        return { message: text };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}
