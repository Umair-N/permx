import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../../src/hooks/use-permissions.js';
import { makeWrapper } from '../helpers.js';

describe('usePermissions', () => {
  it('returns full EffectivePermissions after fetch resolves', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.permissions).toContain('clients.view.all');
    expect(result.current.ui_mappings.routes).toContain('/dashboard');
    expect(result.current.modules.length).toBe(1);
  });

  it('returns empty permissions array for user with no permissions', async () => {
    const wrapper = makeWrapper({
      permissions: {
        permissions: [],
        ui_mappings: { routes: [], components: [], fields: [] },
        modules: [],
      },
    });
    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.permissions).toEqual([]);
    expect(result.current.ui_mappings.routes).toEqual([]);
    expect(result.current.modules).toEqual([]);
  });
});
