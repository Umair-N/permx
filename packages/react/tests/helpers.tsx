import type { ReactNode } from 'react';
import type { EffectivePermissions } from '@permx/core';
import { PermXProvider } from '../src/provider.js';

export function makePermissions(overrides: Partial<EffectivePermissions> = {}): EffectivePermissions {
  return {
    permissions: ['clients.view.all', 'invoices.create.own'],
    structured_permissions: [],
    ui_mappings: {
      routes: ['/dashboard', '/clients'],
      components: ['client-table', 'sidebar-nav'],
      fields: ['client-email', 'client-phone'],
    },
    modules: [{ _id: 'm1', name: 'Clients', slug: 'clients', sort_order: 1, active: true }],
    ...overrides,
  };
}

interface WrapperOptions {
  permissions?: Partial<EffectivePermissions>;
  superAdmin?: boolean;
}

export function makeWrapper({ permissions, superAdmin }: WrapperOptions = {}) {
  const fetchPermissions = () => Promise.resolve(makePermissions(permissions));
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <PermXProvider fetchPermissions={fetchPermissions} superAdmin={superAdmin}>
        {children}
      </PermXProvider>
    );
  };
}
