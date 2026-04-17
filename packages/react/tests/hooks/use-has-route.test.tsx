import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHasRoute } from '../../src/hooks/use-has-route.js';
import { makeWrapper } from '../helpers.js';

describe('useHasRoute', () => {
  it('returns true for existing route', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasRoute('/dashboard'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false for missing route', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasRoute('/nope'), { wrapper });
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns true for any route when super admin', async () => {
    const wrapper = makeWrapper({
      superAdmin: true,
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    const { result } = renderHook(() => useHasRoute('/anything'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
