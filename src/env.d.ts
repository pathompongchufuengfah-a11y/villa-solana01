/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly LINE_NOTIFY_TOKEN?: string;
  readonly BOOKING_EMAIL_TO?: string;
  readonly RESEND_API_KEY?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly ADMIN_SESSION_SECRET?: string;
  readonly PUBLIC_CALENDLY_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_LINE_ID?: string;
  readonly PUBLIC_FACEBOOK_URL?: string;
  readonly PUBLIC_GMAPS_EMBED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
