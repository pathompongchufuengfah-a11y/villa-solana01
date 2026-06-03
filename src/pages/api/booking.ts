import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';

export const prerender = false;

const RATE = 8500;

function nightsBetween(checkin?: string, checkout?: string): number {
  if (!checkin || !checkout) return 0;
  const a = new Date(checkin).getTime();
  const b = new Date(checkout).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

interface BookingPayload {
  name?: string;
  email?: string;
  whatsapp?: string;
  line?: string;
  facebook?: string;
  checkin?: string;
  checkout?: string;
  guests?: string | number;
  notes?: string;
  /** Honeypot — should be empty for real humans. */
  company?: string;
}

function bad(reason: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: reason }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok(extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ ok: true, ...extra }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function formatMessage(p: BookingPayload): string {
  const lines = [
    'New booking request — Villa Solana',
    '',
    `Name:     ${p.name ?? '-'}`,
    `Email:    ${p.email ?? '-'}`,
    `WhatsApp: +${p.whatsapp ?? '-'}`,
    `LINE:     ${p.line ?? '-'}`,
    `Facebook: ${p.facebook ?? '-'}`,
    `Guests:   ${p.guests ?? '-'}`,
    `Check-in: ${p.checkin ?? '-'}`,
    `Check-out:${p.checkout ?? '-'}`,
    '',
    'Notes:',
    p.notes || '(none)',
  ];
  return lines.join('\n');
}

async function notifyLine(message: string): Promise<{ ok: boolean; status?: number }> {
  const token = import.meta.env.LINE_NOTIFY_TOKEN;
  if (!token) return { ok: false };
  try {
    const body = new URLSearchParams({ message: '\n' + message });
    const res = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}

async function notifyEmail(message: string, p: BookingPayload): Promise<{ ok: boolean }> {
  const key = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.BOOKING_EMAIL_TO;
  if (!key || !to) return { ok: false };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Villa Solana <booking@villasolana.example>',
        to: [to],
        reply_to: p.email,
        subject: `New booking: ${p.name ?? 'guest'} · ${p.checkin} → ${p.checkout}`,
        text: message,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export const POST: APIRoute = async ({ request }) => {
  let payload: BookingPayload;
  try {
    payload = (await request.json()) as BookingPayload;
  } catch {
    return bad('invalid_json');
  }

  // Honeypot — silently accept then drop, so bots don't retry.
  if (payload.company && payload.company.trim() !== '') {
    return ok({ dropped: true });
  }

  // Minimal validation: server boundary, so we check.
  const required: (keyof BookingPayload)[] = ['name', 'email', 'checkin', 'checkout'];
  for (const k of required) {
    if (!payload[k]) return bad(`missing_${k}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    return bad('invalid_email');
  }

  const nights = nightsBetween(payload.checkin, payload.checkout);
  const total = nights * RATE;

  // 1. Persist to the booking queue (status 'pending') if Supabase is configured.
  let stored = false;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('bookings').insert({
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp ?? null,
      line: payload.line ?? null,
      facebook: payload.facebook ?? null,
      checkin: payload.checkin,
      checkout: payload.checkout,
      guests: Number(payload.guests) || 2,
      nights,
      total,
      notes: payload.notes ?? null,
      status: 'pending',
      source: 'website',
    });
    stored = !error;
  }

  // 2. Notify the owner. These run regardless of storage so nothing is missed.
  const message = formatMessage(payload);
  const [line, email] = await Promise.all([notifyLine(message), notifyEmail(message, payload)]);

  // Always 200 so the form shows success; the UI also exposes WhatsApp/email
  // fallbacks. For production, configure Supabase + at least one notify channel.
  return ok({
    stored,
    delivered: { line: line.ok, email: email.ok },
    configured: {
      supabase: !!supabase,
      line: !!import.meta.env.LINE_NOTIFY_TOKEN,
      email: !!import.meta.env.RESEND_API_KEY,
    },
  });
};
