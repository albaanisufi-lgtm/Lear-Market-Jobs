import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Lazily initialised rate limiter — only active when Upstash env vars are set
let ratelimit: Ratelimit | null = null;
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
  const redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '24 h') });
  return ratelimit;
}

// Verify reCAPTCHA v3 token — only active when RECAPTCHA_SECRET_KEY is set
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // not configured → allow
  if (!token) return false;
  try {
    const res = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      { method: 'POST' },
    );
    const data = await res.json();
    return data.success === true && (data.score ?? 1) >= 0.5;
  } catch {
    return true; // network error → allow
  }
}

export async function POST(req: NextRequest) {
  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  const rl = getRatelimit();
  if (rl) {
    const { success } = await rl.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Keni dërguar shumë aplikime. Ju lutem provoni përsëri nesër.' },
        { status: 429 },
      );
    }
  }

  // ── Parse Body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Kërkesë e pavlefshme.' }, { status: 400 });
  }

  const { recaptchaToken, ...applicationData } = body as {
    recaptchaToken: string;
    full_name: string;
    phone: string;
    email: string;
    city: string | null;
    position: string;
    location: string;
    experience: string | null;
    cover_letter: string | null;
    availability: string | null;
    profile_image_url: string;
    cv_file_url: string;
  };

  // ── reCAPTCHA ─────────────────────────────────────────────────────────────
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return NextResponse.json(
      { error: 'Verifikimi i sigurisë dështoi. Ju lutem provoni përsëri.' },
      { status: 400 },
    );
  }

  // ── Basic server-side validation ──────────────────────────────────────────
  if (
    !applicationData.full_name?.trim() ||
    !applicationData.phone?.trim() ||
    !applicationData.email?.trim() ||
    !applicationData.position?.trim() ||
    !applicationData.profile_image_url ||
    !applicationData.cv_file_url
  ) {
    return NextResponse.json(
      { error: 'Të dhënat e detyrueshme mungojnë.' },
      { status: 400 },
    );
  }

  // ── Insert to Supabase ────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error: insertErr } = await supabase.from('job_applications').insert({
    ...applicationData,
    status: 'Pending',
  });

  if (insertErr) {
    console.error('Supabase insert error:', insertErr.message);
    return NextResponse.json(
      { error: 'Ruajtja e aplikimit dështoi. Ju lutem provoni përsëri.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
