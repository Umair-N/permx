import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermXReady } from '../../src/hooks/use-permx-ready.js';
import { makeWrapper } from '../helpers.js';

describe('usePermXReady', () => {
  it('returns true after fetch resolves', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => usePermXReady(), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
