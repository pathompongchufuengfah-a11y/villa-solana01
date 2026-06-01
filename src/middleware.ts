import { defineMiddleware } from 'astro:middleware';
import { ADMIN_COOKIE, verifySession } from './lib/auth';

// Protect everything under /admin and /api/admin, except the login routes.
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';

  const guarded = (isAdminPage && !isLoginPage) || (isAdminApi && !isLoginApi);
  if (!guarded) return next();

  const token = context.cookies.get(ADMIN_COOKIE)?.value;
  const valid = await verifySession(token, import.meta.env.ADMIN_SESSION_SECRET);

  if (!valid) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  return next();
});
