import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPermX, syncFromConfig, ensureUserRole } from '@permx/core/mongoose';

export async function initPermX() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const permx = createPermX({
    connection: mongoose.connection,
    superAdmin: {
      // In a real app this comes from your JWT/session.
      // The demo flags super admin on a header for easy toggling.
      check: (userId) => userId === 'super-admin',
    },
  });

  await permx.migrate();
  await seed(permx);

  return { permx, mongod };
}

async function seed(permx: Awaited<ReturnType<typeof createPermX>>) {
  await syncFromConfig(permx.models, {
    modules: [
      { name: 'Projects', slug: 'projects' },
      { name: 'Billing', slug: 'billing' },
      { name: 'Admin', slug: 'admin' },
    ],
    permissions: [
      // Projects
      {
        moduleSlug: 'projects',
        name: 'View Projects',
        key: 'projects.tasks.view.all',
        ui_mappings: [
          { type: 'route', identifier: '/projects' },
          { type: 'component', identifier: 'project-list' },
        ],
      },
      {
        moduleSlug: 'projects',
        name: 'Create Projects',
        key: 'projects.tasks.create.all',
        ui_mappings: [
          { type: 'component', identifier: 'create-project-btn' },
        ],
      },
      {
        moduleSlug: 'projects',
        name: 'Edit Projects',
        key: 'projects.tasks.update.all',
        ui_mappings: [
          { type: 'component', identifier: 'edit-project-btn' },
        ],
      },
      // Billing
      {
        moduleSlug: 'billing',
        name: 'View Billing',
        key: 'billing.invoices.view.all',
        ui_mappings: [
          { type: 'route', identifier: '/billing' },
          { type: 'component', identifier: 'invoice-list' },
        ],
      },
      {
        moduleSlug: 'billing',
        name: 'View Revenue Field',
        key: 'billing.invoices:revenue.view.all',
        ui_mappings: [
          { type: 'field', identifier: 'revenue' },
        ],
      },
      // Admin
      {
        moduleSlug: 'admin',
        name: 'Access Admin Panel',
        key: 'admin.panel.view.all',
        ui_mappings: [
          { type: 'route', identifier: '/admin' },
        ],
      },
      // Subscription feature
      {
        moduleSlug: 'admin',
        name: 'SSO Settings',
        key: 'subscription.sso.view.all',
        ui_mappings: [
          { type: 'component', identifier: 'sso-settings' },
        ],
      },
    ],
    roles: [
      {
        name: 'Viewer',
        slug: 'viewer',
        permissionKeys: [
          'projects.tasks.view.all',
          'billing.invoices.view.all',
        ],
      },
      {
        name: 'Editor',
        slug: 'editor',
        inheritsFrom: ['viewer'],
        permissionKeys: [
          'projects.tasks.create.all',
          'projects.tasks.update.all',
        ],
      },
      {
        name: 'Admin',
        slug: 'admin',
        inheritsFrom: ['editor'],
        permissionKeys: [
          'billing.invoices:revenue.view.all',
          'admin.panel.view.all',
          'subscription.sso.view.all',
        ],
      },
    ],
  });

  const viewer = await permx.models.Role.findOne({ slug: 'viewer' });
  const editor = await permx.models.Role.findOne({ slug: 'editor' });
  const admin = await permx.models.Role.findOne({ slug: 'admin' });

  if (viewer) await ensureUserRole(permx.models, 'user-viewer', viewer._id.toString());
  if (editor) await ensureUserRole(permx.models, 'user-editor', editor._id.toString());
  if (admin) await ensureUserRole(permx.models, 'user-admin', admin._id.toString());
}
