import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    // Silently succeed if not configured — form submission should not fail
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await req.json();
    const { full_name, position, email, phone, city } = body;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LEAR MARKET <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `📋 Aplikim i ri: ${full_name} — ${position}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
            <div style="background: #0f2d5c; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px;">LEAR MARKET — Aplikim i Ri</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b; width: 140px;">EMRI</td>
                <td style="padding: 10px 16px; font-size: 14px; color: #1e293b; font-weight: 600;">${full_name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b;">POZICIONI</td>
                <td style="padding: 10px 16px; font-size: 14px; color: #0f2d5c; font-weight: 600;">${position}</td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b;">EMAIL</td>
                <td style="padding: 10px 16px; font-size: 14px; color: #1e293b;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b;">TELEFON</td>
                <td style="padding: 10px 16px; font-size: 14px; color: #1e293b;">${phone}</td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b;">QYTETI</td>
                <td style="padding: 10px 16px; font-size: 14px; color: #1e293b;">${city ?? '—'}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/admin"
                 style="display: inline-block; background: #0f2d5c; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Shiko në Panel Admin →
              </a>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">LEAR MARKET — Sistemi i Aplikimeve</p>
          </div>
        `,
      }),
    });
  } catch {
    // Log but never break the user's form submission
    console.error('[notify-new-application] email send failed');
  }

  return NextResponse.json({ ok: true });
}
