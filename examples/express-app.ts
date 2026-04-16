/**
 * PermX — Complete Express + MongoDB example
 *
 * Run: npx tsx examples/express-app.ts
 * Requires: MongoDB running on localhost:27017
 *
 * This example shows the full setup from zero to protected routes:
 * 1. Connect to MongoDB
 * 2. Initialize PermX with Mongoose
 * 3. Seed modules, permissions, roles
 * 4. Assign a role to a user
 * 5. Protect Express routes with middleware
 * 6. Test authorization
 */

import mongoose from 'mongoose';
import express from 'express';
import { createPermX } from '../src/mongoose/factory.js';
import { createPermXMiddleware } from '../src/middleware/authorize.js';

async function main() {
  // ── 1. Connect to MongoDB ───────────────────────────────
  await mongoose.connect('mongodb://localhost:27017/permx-example');
  console.log('Connected to MongoDB');

  // ── 2. Initialize PermX ─────────────────────────────────
  const permx = createPermX({
    connection: mongoose.connection,
    cache: { ttl: 15_000 },
    superAdmin: {
      check: (userId) => userId === 'super-admin',
    },
  });

  await permx.migrate();
  console.log('PermX initialized with indexes');

  // ── 3. Seed data ────────────────────────────────────────
  // Clean up from previous runs
  await Promise.all([
    permx.models.Module.deleteMany({}),
    permx.models.Permission.deleteMany({}),
    permx.models.Role.deleteMany({}),
    permx.models.UserRole.deleteMany({}),
  ]);

  // Create a module
  const clients_module = await permx.createModule({
    name: 'Clients',
    slug: 'clients',
    description: 'Client management module',
    icon: 'users',
  });
  console.log('Created module:', clients_module.name);

  // Create permissions with UI mappings
  const view_perm = await permx.createPermission({
    module: clients_module._id,
    name: 'View All Clients',
    key: 'clients.clients.view.all',
    action: 'view',
    scope: 'all',
    resource: 'clients',
    ui_mappings: [
      { type: 'route', identifier: '/clients' },
      { type: 'component', identifier: 'client-list-table' },
    ],
    api_mappings: [
      { service: 'client-hq', method: 'GET', path: '/clients' },
      { service: 'client-hq', method: 'GET', path: '/clients/:id' },
    ],
  });

  const create_perm = await permx.createPermission({
    module: clients_module._id,
    name: 'Create Clients',
    key: 'clients.clients.create.all',
    action: 'create',
    scope: 'all',
    resource: 'clients',
    ui_mappings: [
      { type: 'component', identifier: 'create-client-btn' },
    ],
  });

  console.log('Created permissions:', view_perm.name, '+', create_perm.name);

  // Create a role with both permissions
  const manager_role = await permx.createRole({
    name: 'Client Manager',
    slug: 'client-manager',
    description: 'Can view and create clients',
    permissions: [view_perm._id, create_perm._id],
  });
  console.log('Created role:', manager_role.name);

  // Assign role to a user
  const user_id = 'user-123';
  await permx.assignRole(user_id, manager_role._id, {
    assigned_by: 'admin',
  });
  console.log(`Assigned '${manager_role.name}' to user '${user_id}'`);

  // ── 4. Test authorization directly ──────────────────────
  const auth_result = await permx.authorize(user_id, 'clients.clients.view.all');
  console.log('\nDirect authorization check:');
  console.log('  clients.clients.view.all →', auth_result.authorized ? 'GRANTED' : 'DENIED');

  const denied_result = await permx.authorize(user_id, 'clients.clients.delete.all');
  console.log('  clients.clients.delete.all →', denied_result.authorized ? 'GRANTED' : 'DENIED');

  // Get full permissions (what you'd send to the frontend)
  const perms = await permx.getUserPermissions(user_id);
  console.log('\nUser permissions:');
  console.log('  Keys:', perms.permissions);
  console.log('  Routes:', perms.ui_mappings.routes);
  console.log('  Components:', perms.ui_mappings.components);

  // ── 5. Express app with middleware ──────────────────────
  const app = express();

  // Simulate auth middleware (in real app, this comes from your auth system)
  app.use((req, _res, next) => {
    (req as any).user = { id: user_id };
    next();
  });

  const auth = createPermXMiddleware(permx, {
    extractUserId: (req) => (req as any).user?.id,
  });

  // Protected routes
  app.get('/clients', auth.authorize('clients.clients.view.all'), (_req, res) => {
    res.json({ clients: [{ id: 1, name: 'Acme Corp' }] });
  });

  app.post('/clients', auth.authorize('clients.clients.create.all'), (_req, res) => {
    res.json({ created: true });
  });

  app.delete('/clients/:id', auth.authorize('clients.clients.delete.all'), (_req, res) => {
    res.json({ deleted: true });
  });

  // Permissions endpoint (for frontend hydration)
  app.get('/api/permissions/my', async (req, res) => {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const permissions = await permx.getUserPermissions(uid);
    res.json(permissions);
  });

  const server = app.listen(3001, () => {
    console.log('\nExpress server running on http://localhost:3001');
    console.log('\nTry these:');
    console.log('  curl http://localhost:3001/clients              → 200 (authorized)');
    console.log('  curl -X DELETE http://localhost:3001/clients/1   → 403 (no delete permission)');
    console.log('  curl http://localhost:3001/api/permissions/my    → full permissions payload');
  });

  // ── 6. Listen for events ────────────────────────────────
  permx.emitter?.on('authorize', (event) => {
    console.log(`[EVENT] authorize: ${event.permissionKey} → ${event.authorized ? 'granted' : 'denied'} (${event.duration_ms}ms)`);
  });

  permx.emitter?.on('authorize.denied', (event) => {
    console.log(`[EVENT] denied: user=${event.userId} key=${event.permissionKey}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    server.close();
    await mongoose.disconnect();
    console.log('\nShutdown complete');
    process.exit(0);
  });
}

main().catch(console.error);
