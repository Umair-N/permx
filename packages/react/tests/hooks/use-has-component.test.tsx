import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHasComponent } from '../../src/hooks/use-has-component.js';
import { makeWrapper } from '../helpers.js';

describe('useHasComponent', () => {
  it('returns true for existing component', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasComponent('client-table'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false for missing component', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useHasComponent('nope-component'), { wrapper });
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns true for any component when super admin', async () => {
    const wrapper = makeWrapper({
      superAdmin: true,
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    const { result } = renderHook(() => useHasComponent('anything'), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
