import type { APIRoute } from 'astro';
import { getSupabaseAdmin, type BookingStatus } from '../../../lib/supabase';

export const prerender = false;
// Auth is enforced by src/middleware.ts for all /api/admin/* except login.

const VALID_STATUS: BookingStatus[] = ['pending', 'confirmed', 'cancelled'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ ok: false, error: 'supabase_not_configured' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const { action, id } = body ?? {};
  if (!id) return json({ ok: false, error: 'missing_id' }, 400);

  switch (action) {
    case 'set_status': {
      const status = body.status as BookingStatus;
      if (!VALID_STATUS.includes(status)) return json({ ok: false, error: 'bad_status' }, 400);
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      return error ? json({ ok: false, error: error.message }, 500) : json({ ok: true });
    }

    case 'update': {
      // Whitelist the fields an admin may edit.
      const allowed = ['name', 'email', 'whatsapp', 'checkin', 'checkout', 'guests', 'notes', 'total', 'status'];
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (k in body) patch[k] = body[k];
      if (patch.status && !VALID_STATUS.includes(patch.status as BookingStatus)) {
        return json({ ok: false, error: 'bad_status' }, 400);
      }
      if (Object.keys(patch).length === 0) return json({ ok: false, error: 'nothing_to_update' }, 400);
      const { error } = await supabase.from('bookings').update(patch).eq('id', id);
      return error ? json({ ok: false, error: error.message }, 500) : json({ ok: true });
    }

    case 'delete': {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      return error ? json({ ok: false, error: error.message }, 500) : json({ ok: true });
    }

    default:
      return json({ ok: false, error: 'unknown_action' }, 400);
  }
};
