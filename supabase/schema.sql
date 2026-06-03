-- Villa Solana — booking queue schema
-- Run this in Supabase → SQL Editor (once), or via the Supabase CLI.

create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  whatsapp    text,
  line        text,
  facebook    text,
  checkin     date not null,
  checkout    date not null,
  guests      int  not null default 2,
  nights      int,
  total       int,
  notes       text,
  status      text not null default 'pending'
              check (status in ('pending','confirmed','cancelled')),
  source      text default 'website'
);

create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_created_idx on public.bookings (created_at desc);
create index if not exists bookings_dates_idx  on public.bookings (checkin, checkout);

-- Lock the table down. We only ever touch it from the server with the
-- service-role key (which bypasses RLS), so no public policies are needed.
-- With RLS on and no policies, the anon/public key can read/write nothing.
alter table public.bookings enable row level security;
