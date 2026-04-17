import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHasPermission } from '../../src/hooks/use-has-permission.js';
import { makeWrapper } from '../helpers.js';

describe('useHasPermission', () => {
  it('returns true for existing permission key', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasPermission('clients.view.all'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false for missing permission key', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasPermission('does.not.exist'), { wrapper });
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns true for any key when super admin', async () => {
    const wrapper = makeWrapper({ superAdmin: true, permissions: { permissions: [] } });
    const { result } = renderHook(() => useHasPermission('any.random.key'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
