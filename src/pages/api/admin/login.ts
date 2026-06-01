import type { APIRoute } from 'astro';
import { ADMIN_COOKIE, createSession, SESSION_MAX_AGE } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const expected = import.meta.env.ADMIN_PASSWORD;
  const secret = import.meta.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret) {
    return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let password = '';
  try {
    const body = await request.json();
    password = String(body.password ?? '');
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400 });
  }

  if (password !== expected) {
    return new Response(JSON.stringify({ ok: false, error: 'wrong_password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await createSession(secret);
  cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
