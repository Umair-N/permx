/**
 * Reference: integrating PermX with Next.js App Router.
 *
 * This file is a documentation-only example — it is not compiled as part of
 * the build. Copy the relevant snippets into your Next.js project.
 *
 * Layout:
 *   lib/permx.ts                         — shared PermX instance
 *   lib/auth.ts                          — your auth layer (BYO)
 *   app/api/permissions/my/route.ts      — endpoint the React SDK calls
 *   app/api/admin/users/route.ts         — an authorized API route
 *   app/admin/page.tsx                   — server-side route gate
 *   middleware.ts                        — edge-level route protection
 *   app/layout.tsx                       — client-side <PermXProvider>
 */

// ─────────────────────────────────────────────────────────────────
// lib/permx.ts — one shared instance (module-level singleton)
// ─────────────────────────────────────────────────────────────────
/*
import mongoose from 'mongoose';
import { createPermX } from '@permx/core/mongoose';

if (!mongoose.connection.readyState) {
  await mongoose.connect(process.env.MONGODB_URI!);
}

export const permx = createPermX({
  connection: mongoose.connection,
  cache: { ttl: 60_000, max_size: 10_000 },
  tenancy: { enabled: true },
});
*/

// ─────────────────────────────────────────────────────────────────
// lib/auth.ts — PermX is auth-agnostic. Plug in any auth library.
// ─────────────────────────────────────────────────────────────────
/*
import { cookies } from 'next/headers';
import { verifyJwt } from './jwt';

export async function getUserIdFromSession(req?: Request): Promise<string | null> {
  const token = req
    ? req.headers.get('authorization')?.replace('Bearer ', '')
    : (await cookies()).get('session')?.value;
  if (!token) return null;

  const payload = await verifyJwt(token);
  return payload?.sub ?? null;
}
*/

// ─────────────────────────────────────────────────────────────────
// app/api/permissions/my/route.ts — the endpoint @permx/react calls
// ─────────────────────────────────────────────────────────────────
/*
import { NextResponse } from 'next/server';
import { permx } from '@/lib/permx';
import { getUserIdFromSession } from '@/lib/auth';

export async function GET(req: Request) {
  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = req.headers.get('x-tenant-id') ?? undefined;
  const perms = await permx.getUserPermissions(userId, { tenantId });
  return NextResponse.json(perms, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}
*/

// ─────────────────────────────────────────────────────────────────
// app/api/admin/users/route.ts — per-route authorization
// ─────────────────────────────────────────────────────────────────
/*
import { NextResponse } from 'next/server';
import { permx } from '@/lib/permx';
import { getUserIdFromSession } from '@/lib/auth';

export async function GET(req: Request) {
  const userId = await getUserIdFromSession(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { authorized } = await permx.authorize(userId, 'admin.users.view.all');
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await listUsers();
  return NextResponse.json(users);
}
*/

// ─────────────────────────────────────────────────────────────────
// app/admin/page.tsx — server-side gate (no client flash)
// ─────────────────────────────────────────────────────────────────
/*
import { redirect } from 'next/navigation';
import { permx } from '@/lib/permx';
import { getUserIdFromSession } from '@/lib/auth';
import { AdminDashboard } from './AdminDashboard';

export default async function AdminPage() {
  const userId = await getUserIdFromSession();
  if (!userId) redirect('/login');

  const { authorized } = await permx.authorize(userId, 'admin.dashboard.view.all');
  if (!authorized) redirect('/403');

  return <AdminDashboard />;
}
*/

// ─────────────────────────────────────────────────────────────────
// middleware.ts — edge-level route protection
// ─────────────────────────────────────────────────────────────────
// Note: PermX uses Node APIs (Mongoose). Run Next.js middleware on the
// Node runtime, not Edge, if you want to call permx directly. For Edge,
// fetch a lightweight /api/authorize endpoint instead.
/*
import { NextResponse, type NextRequest } from 'next/server';
import { handleAuthorization } from '@permx/core';
import { permx } from '@/lib/permx';

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const userId = req.cookies.get('userId')?.value;
  if (!userId) return NextResponse.redirect(new URL('/login', req.url));

  const outcome = await handleAuthorization(
    permx,
    { userId, tenantId: req.headers.get('x-tenant-id') ?? undefined },
    'admin.dashboard.view.all',
  );

  if (outcome.action === 'deny') return NextResponse.redirect(new URL('/403', req.url));
  if (outcome.action === 'error') return new NextResponse('Internal Error', { status: 500 });
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
*/

// ─────────────────────────────────────────────────────────────────
// app/providers.tsx — client-side <PermXProvider>
// ─────────────────────────────────────────────────────────────────
/*
'use client';

import { PermXProvider } from '@permx/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PermXProvider
      fetchPermissions={() =>
        fetch('/api/permissions/my', { credentials: 'include' }).then((r) => r.json())
      }
      fallback={<div>Loading permissions…</div>}
    >
      {children}
    </PermXProvider>
  );
}
*/

// ─────────────────────────────────────────────────────────────────
// Admin panel: invalidate cache after role change
// ─────────────────────────────────────────────────────────────────
/*
// app/api/admin/users/[id]/roles/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const adminId = await getUserIdFromSession(req);
  const { authorized } = await permx.authorize(adminId!, 'admin.users.update.all');
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { roleId } = await req.json();
  await ensureUserRole(permx.models, params.id, roleId);

  // Critical: clear the cache so the next authorize() for that user is fresh
  permx.invalidateUser(params.id);

  return NextResponse.json({ ok: true });
}
*/

export {};
