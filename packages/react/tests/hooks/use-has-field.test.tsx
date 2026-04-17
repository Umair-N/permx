import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHasField } from '../../src/hooks/use-has-field.js';
import { makeWrapper } from '../helpers.js';

describe('useHasField', () => {
  it('returns true for existing field', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasField('client-email'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false for missing field', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasField('nope-field'), { wrapper });
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns true for any field when super admin', async () => {
    const wrapper = makeWrapper({
      superAdmin: true,
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    const { result } = renderHook(() => useHasField('anything'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
