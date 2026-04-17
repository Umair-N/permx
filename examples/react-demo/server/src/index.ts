import express, { type Request } from 'express';
import cors from 'cors';
import { createPermXMiddleware } from '@permx/core/express';
import { initPermX } from './permx-instance.ts';

function getUserId(req: Request): string | undefined {
  // Demo-only: trust the x-user-id header. In a real app this comes from
  // your auth middleware (JWT, session cookie, etc.) before PermX runs.
  const header = req.header('x-user-id');
  return header?.trim() || undefined;
}

async function main() {
  const { permx } = await initPermX();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const auth = createPermXMiddleware(permx, {
    extractUserId: (req) => getUserId(req),
    isSuperAdmin: (req) => getUserId(req) === 'super-admin',
  });

  // The endpoint the React SDK calls on mount.
  app.get('/api/permissions/my', async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header' });
    }
    try {
      const perms = await permx.getUserPermissions(userId);
      res.json(perms);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to load permissions' });
    }
  });

  // Simple "who am I" for the demo UI.
  app.get('/api/me', (req, res) => {
    const userId = getUserId(req);
    res.json({
      userId: userId ?? null,
      isSuperAdmin: userId === 'super-admin',
    });
  });

  // Protected sample routes.
  app.get(
    '/api/projects',
    auth.authorize('projects.tasks.view.all'),
    (_req, res) => {
      res.json([
        { id: 1, name: 'Onboarding redesign' },
        { id: 2, name: 'Quarterly planning' },
      ]);
    },
  );

  app.post(
    '/api/projects',
    auth.authorize('projects.tasks.create.all'),
    (_req, res) => {
      res.status(201).json({ id: 3, name: 'New project', created: true });
    },
  );

  app.get(
    '/api/billing/invoices',
    auth.authorize('billing.invoices.view.all'),
    (_req, res) => {
      res.json([
        { id: 'inv-001', customer: 'Acme Co', total: 12_400 },
        { id: 'inv-002', customer: 'Globex', total: 5_200 },
      ]);
    },
  );

  app.get(
    '/api/admin/stats',
    auth.authorize('admin.panel.view.all'),
    (_req, res) => {
      res.json({ users: 128, projects: 42, mrr: 19_500 });
    },
  );

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`\n✓ PermX demo server running on http://localhost:${port}`);
    console.log(`  Try the users: user-viewer, user-editor, user-admin, super-admin\n`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
