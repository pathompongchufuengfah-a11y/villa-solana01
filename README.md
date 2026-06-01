# Villa Solana — Astro demo site

A marketing site + booking system for a Phuket pool villa, built on
**Astro 4 + TypeScript + Tailwind**. Static public pages, a Supabase-backed
booking queue, and a password-protected admin dashboard.

## Stack

- Astro 4 (hybrid: prerendered public pages + serverless `/admin` & `/api/*`)
- TypeScript (strict)
- Tailwind CSS
- **Supabase** (Postgres) for the booking queue
- Admin auth via signed httpOnly cookie (Web Crypto HMAC, no extra deps)
- Built-in `astro:assets` for image optimization (replaces the deprecated `@astrojs/image`)
- Astro i18n routing — EN / TH / RU / ZH (fully translated)
- Lightweight CSS/vanilla-JS animations (no UI framework on the client)
- Deploy target: **Vercel** (`@astrojs/vercel/serverless` adapter)

## Pages

| Route        | What it is                                                    |
| ------------ | ------------------------------------------------------------- |
| `/`          | Home — hero, why-direct, amenities, gallery, location, CTA   |
| `/rooms`     | Room types with photos                                        |
| `/amenities` | Amenity grid + "included extras"                              |
| `/location`  | Google Maps embed + nearby points                             |
| `/booking`   | Booking form → posts to `/api/booking`                        |
| `/contact`   | WhatsApp / LINE / email / phone + Calendly fallback           |
| `/admin`     | **Password-protected** booking queue — confirm / cancel / edit / delete |
| `/admin/login` | Admin sign-in                                               |
| `/api/booking` | `POST` JSON → saves to Supabase (status `pending`) + LINE + email |
| `/api/admin/*` | Login / logout / booking actions (session-guarded)         |

## Components

All under `src/components/`:

- `Hero.astro`
- `SectionHeading.astro`
- `AmenityCard.astro`
- `GalleryGrid.astro` (with vanilla-JS lightbox)
- `BookingForm.astro` (vanilla-JS, no React)
- `LanguageSwitcher.astro`
- `WhatsAppFloat.astro`
- `Header.astro` / `Footer.astro` / `Icon.astro`

i18n strings live in `src/i18n/ui.ts`. EN is canonical; missing TH/RU/ZH keys
fall back to EN via `useT()` in `src/i18n/utils.ts`.

## Run locally

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env
# (edit values — see "Environment variables" below)

# 3. Dev server (http://localhost:4321)
npm run dev

# 4. Production build + preview
npm run build
npm run preview
```

## Environment variables

| Variable                     | Where  | What it does                                                    |
| ---------------------------- | ------ | --------------------------------------------------------------- |
| `SUPABASE_URL`               | server | Supabase project URL — stores the booking queue                 |
| `SUPABASE_SERVICE_ROLE_KEY`  | server | Service-role key (bypasses RLS). **Server-only, never expose.**  |
| `ADMIN_PASSWORD`             | server | The password to log into `/admin`                               |
| `ADMIN_SESSION_SECRET`       | server | Random 32+ byte string used to sign the admin session cookie    |
| `LINE_NOTIFY_TOKEN`          | server | Notifies a LINE group/account on each booking enquiry           |
| `RESEND_API_KEY`             | server | Sends a transactional email via Resend.com                      |
| `BOOKING_EMAIL_TO`           | server | Inbox for booking emails (e.g. `stay@villasolana.com`)          |
| `PUBLIC_CALENDLY_URL`        | client | Calendly link shown as fallback under the form                  |
| `PUBLIC_WHATSAPP_NUMBER`     | client | Used by the floating WhatsApp button & contact page (no `+`)    |
| `PUBLIC_LINE_ID`             | client | LINE handle (e.g. `@villasolana`)                               |
| `PUBLIC_GMAPS_EMBED_URL`     | client | Google Maps `iframe` src for `/location`                        |

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If neither `LINE_NOTIFY_TOKEN` nor `RESEND_API_KEY` is set, the form still
shows a success screen and the user is invited to use WhatsApp/LINE/email.
The client also falls back to `mailto:` if the server returns a non-2xx.

## Booking queue + admin dashboard

Bookings flow like this:

```
Guest submits /booking
   → POST /api/booking
       → saved to Supabase `bookings` table as status = "pending"
       → owner notified (LINE + email)
   → guest sees success screen
Owner opens /admin (password)
   → sees the queue, filters by status
   → Confirm / Cancel / Reset / Edit / Delete
```

So booking is **semi-automatic**: it's captured and queued automatically, and
the admin moderates (confirm/edit) in case anything is wrong. No double-booking
from a robot — a human always approves.

### One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → Run
3. **Settings → API** → copy the **Project URL** and the **service_role** key
4. Put them in `.env`:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ADMIN_PASSWORD=pick-a-strong-password
   ADMIN_SESSION_SECRET=<output of the node command above>
   ```
5. Restart `npm run dev`, submit a test booking, then open `http://localhost:4321/admin`

> The service-role key bypasses Row Level Security and is **only** ever read on
> the server (`src/lib/supabase.ts`, `/api/*`). It is never sent to the browser.
> Admin pages are guarded by `src/middleware.ts` via a signed httpOnly cookie.

If Supabase is **not** configured, the site still runs — bookings just aren't
stored; they only go out via LINE/email, and `/admin` shows a setup notice.

## Deploy to Vercel (and share the link)

### A. Push to GitHub

```bash
git init
git add -A
git commit -m "Villa Solana site"
gh repo create villa-solana --private --source=. --push   # or create on github.com and push
```

### B. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new), import the repo
2. Framework preset auto-detects **Astro** — leave build settings as-is
3. **Settings → Environment Variables** → add every server var from the table
   above (Supabase, admin, LINE, email) **and** the `PUBLIC_*` ones
4. **Deploy**

Vercel gives you a live URL instantly:

```
https://villa-solana.vercel.app
```

That link is already **shareable** — send it to the client as-is.

### C. (Optional) Custom domain

- Vercel → Project → **Domains** → add `villasolana.com` (or a subdomain)
- Point the domain's DNS to Vercel (it shows the exact records)
- Then update `site:` in `astro.config.mjs` to the real domain and redeploy
  (fixes canonical URLs, Open Graph, hreflang, sitemap)

### D. Make it easy to share

- **QR code** for print/Line/IG bio: paste the URL into
  [qr-code-generator.com](https://www.qr-code-generator.com/) → download SVG/PNG
- **Link preview** (the image people see when pasting the link in LINE/FB/IG):
  add a `public/og.jpg` (1200×630) with a hero photo — already referenced in
  `BaseLayout.astro`. Verify it renders at [opengraph.xyz](https://www.opengraph.xyz/)
- **Short link**: Vercel domains are already short; or use a Bitly/your-domain short link
- **Preview deploys**: every Git branch/PR gets its own URL — handy for showing
  the client a change before it goes live

> CLI alternative: `npm i -g vercel && vercel link && vercel deploy --prod`
> (still add env vars in the dashboard first).

The Vercel adapter is wired in `astro.config.mjs`. Public pages prerender to
static HTML; `/admin` and `/api/*` run as serverless functions.

## Performance budget

- **LCP < 2 s** — hero image uses `fetchpriority="high"` and `decoding="async"`;
  fonts are preloaded
- **No React/Vue on the client** — interactivity (lightbox, header, form,
  animations) is vanilla JS in `<script is:inline>` blocks; ~1 KB gzipped
- **Images lazy-loaded** with `loading="lazy"` and `decoding="async"`
- **Lighthouse target: 100/100 mobile** — verify with the checklist below

## SEO

- Per-page `<title>` / `<meta description>`
- Open Graph + Twitter card meta in `BaseLayout.astro`
- Canonical link + `hreflang` for every locale
- JSON-LD `LodgingBusiness` schema on every page
- `robots.txt` + (TODO) sitemap

## Repo layout

```
src/
  components/        # reusable Astro components
  i18n/              # ui.ts (strings) + utils.ts (t helper, locale routing)
  layouts/           # BaseLayout.astro
  lib/
    supabase.ts      # server-only Supabase client (service role)
    auth.ts          # signed-cookie admin session (HMAC, Web Crypto)
  middleware.ts      # guards /admin and /api/admin
  pages/
    *.astro          # public pages (prerendered)
    th/ ru/ zh/      # locale wrappers (one per page)
    admin/           # login.astro + index.astro (dashboard, SSR)
    api/
      booking.ts     # public POST → Supabase + notify
      admin/         # login / logout / booking actions (guarded)
  styles/global.css
supabase/
  schema.sql         # run once in Supabase SQL editor
public/
  favicon.svg, robots.txt
.env.example
astro.config.mjs · tailwind.config.mjs · tsconfig.json
```

---

## Verify checklist (before pushing)

Work through this on a real device, not just localhost:

- [ ] `npm run build` finishes clean (no warnings about missing assets or types)
- [ ] `npm run preview` — click through every page in the nav
- [ ] **Mobile** — open Chrome DevTools, Pixel 7 viewport: header transitions on scroll, mobile menu opens, no horizontal scrollbar
- [ ] **Booking form** — submit empty (HTML5 validation), then a valid request; verify success screen, then "Make another enquiry"
- [ ] **Booking API** — without env vars, response is `{ok:true, configured:{...}}`; with Supabase set, the booking appears in the `bookings` table
- [ ] **Admin login** — `/admin` redirects to `/admin/login` when logged out; wrong password is rejected; right password lands on the queue
- [ ] **Admin actions** — Confirm / Cancel / Reset change the status badge; Edit saves changes; Delete removes the row (all reflected in Supabase)
- [ ] **Admin session** — after deploy, the cookie is `Secure` + `httpOnly`; Sign out returns to login
- [ ] **Animations** — scroll progress bar fills; cards stagger in; hero price counts up; enable "Reduce motion" in the OS and confirm everything is instant/static
- [ ] **Gallery lightbox** — click an image, arrow keys navigate, Esc closes, clicking the backdrop closes
- [ ] **Language switcher** — switch to TH; nav labels update; falls back to EN content for unset strings; URL becomes `/th/...`
- [ ] **WhatsApp float** — opens the right number with the prefilled message
- [ ] **Maps embed** — actually loads (replace the default `PUBLIC_GMAPS_EMBED_URL` with the villa's real share-embed URL)
- [ ] **Lighthouse mobile** — run on a deployed preview (not dev). Target 95+ across Performance / Accessibility / Best Practices / SEO; investigate any score under 95
- [ ] **LCP** — DevTools Performance tab, mobile throttling, LCP under 2 s. Hero image is the LCP candidate
- [ ] **JSON-LD** — paste a page URL into Google's [Rich Results Test](https://search.google.com/test/rich-results); `LodgingBusiness` validates with no errors
- [ ] **OG preview** — paste the prod URL into [opengraph.xyz](https://www.opengraph.xyz/) — title, description, image render correctly
- [ ] **404 / typos** — visit `/foo`, confirm a graceful default 404 (add `src/pages/404.astro` if you want a branded one)
- [ ] **Accessibility** — Tab through the page: focus rings are visible, skip-link works, gallery buttons announce labels

---

## Customize before using for a real client

These are the demo placeholders that **must** be swapped:

### Content & copy

- `src/i18n/ui.ts` — every EN string (name, address, price, rates, reviews count, room descriptions, amenity list)
- `src/pages/amenities.astro` — the `extras` array (housekeeping schedule, chef pricing, etc.)
- `src/layouts/BaseLayout.astro` — JSON-LD: phone, lat/long, postal code, star rating, room count
- `src/components/Footer.astro` — phone, email, address (or move to `ui.ts` and read from there)

### Images

- Replace all `images.unsplash.com` URLs with the villa's real photos. Either:
  - Drop files into `src/assets/` and `import` them so `astro:assets` optimizes them (best for Lighthouse), **or**
  - Host on Cloudinary/Bunny and update the `IMG` URLs
- The image domain allowlist is in `astro.config.mjs` → `image.domains`
- Generate an `og.jpg` (1200×630) and put it in `public/`

### Integrations

- `LINE_NOTIFY_TOKEN` — issue one at https://notify-bot.line.me/my/
  (Note: LINE Notify is being deprecated in 2026 — for new builds, prefer a LINE Messaging API bot. This demo uses Notify for setup speed.)
- `RESEND_API_KEY` — sign up at resend.com, verify the sending domain
- `PUBLIC_CALENDLY_URL` — paste the owner's scheduling link
- `PUBLIC_GMAPS_EMBED_URL` — Google Maps → Share → Embed a map → copy the `src` from the `<iframe>`
- `PUBLIC_WHATSAPP_NUMBER` — international format, no `+`, no spaces (e.g. `66812345678`)
- `PUBLIC_LINE_ID` — including the `@` if it's an official account

### Branding

- `tailwind.config.mjs` — the `cream` / `ocean` / `sand` / `ink` palettes; rename if the villa has its own brand
- `src/styles/global.css` — body background + font stack
- `public/favicon.svg` — replace the "S" with the villa's logo mark
- `BaseLayout.astro` — Google Fonts `<link>` if you swap typefaces

### Legal / footer

- `Footer.astro` — Privacy / House rules / Sitemap links currently `href="#"`. Either build those pages or remove the links.
- Year (2026) is hardcoded in `ui.ts > footer.rights` — turn into `new Date().getFullYear()` if you'd rather it auto-update.

### Domain & analytics

- Update `site` in `astro.config.mjs` to the production domain (used by canonical, OG, sitemap, hreflang)
- Vercel Web Analytics is enabled by default in the adapter config — disable in `astro.config.mjs` if not wanted
- No third-party analytics included by design (Lighthouse Performance loves this); add GA4 / Plausible only if the client asks

### i18n

- EN / TH / RU / ZH are all fully translated in `src/i18n/ui.ts`. **The RU and ZH
  copy is machine-translated** — have a native speaker review tone before going
  live with a real client. TH is reviewed.
- Adding a **new page** means adding the locale wrappers too:
  `src/pages/th/<name>.astro`, `ru/`, `zh/` — each is just
  `import Page from '../<name>.astro'; <Page />`.
- The `useT()` helper falls back to EN per-string, so a missing key never breaks
  the page — it just shows English.

### Admin / backend

- `ADMIN_PASSWORD` — set a strong one; it's the only credential for `/admin`
- `ADMIN_SESSION_SECRET` — must be set in production or login fails by design
- The booking rate (฿8,500) is hardcoded in `src/pages/api/booking.ts` (`RATE`)
  and `src/components/BookingForm.astro` — change both, or lift into `.env`
- Want email/LINE on **status change** (e.g. notify guest on confirm)? Hook it
  into `src/pages/api/admin/booking.ts` in the `set_status` case
- For multiple staff logins or audit trails, graduate from the single-password
  scheme to Supabase Auth + RLS policies
