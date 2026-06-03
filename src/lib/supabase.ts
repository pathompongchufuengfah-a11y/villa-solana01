import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// Node < 22 has no global WebSocket. supabase-js wires up a Realtime client on
// creation and needs one — even though we only ever make REST queries. Provide
// the `ws` implementation so client init doesn't throw on Vercel's Node 20.
import WebSocket from 'ws';

export interface Booking {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string | null;
  line: string | null;
  facebook: string | null;
  checkin: string;
  checkout: string;
  guests: number;
  nights: number | null;
  total: number | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: string | null;
}

export type BookingStatus = Booking['status'];

/** True when both Supabase env vars are present. */
export function supabaseConfigured(): boolean {
  return !!(import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Server-only Supabase client using the service-role key. Never import this
 * into client-side code — the key bypasses Row Level Security.
 * Returns null when Supabase isn't configured, so callers can degrade safely.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket as any },
  });
}
