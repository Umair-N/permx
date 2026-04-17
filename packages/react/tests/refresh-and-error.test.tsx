import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { EffectivePermissions } from '@permx/core';
import { PermXProvider } from '../src/provider.js';
import { useHasPermission } from '../src/hooks/use-has-permission.js';
import { usePermXRefresh } from '../src/hooks/use-permx-refresh.js';
import { usePermXError } from '../src/hooks/use-permx-error.js';

function perms(overrides: Partial<EffectivePermissions> = {}): EffectivePermissions {
  return {
    permissions: ['posts.view.all'],
    structured_permissions: [],
    ui_mappings: { routes: [], components: [], fields: [] },
    modules: [],
    ...overrides,
  };
}

describe('errorFallback', () => {
  it('renders errorFallback with the error when fetch fails', async () => {
    const err = new Error('network down');
    const fetchPermissions = vi.fn(() => Promise.reject(err));

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        fallback={<div>loading</div>}
        errorFallback={(error, retry) => (
          <div>
            <span>error: {error.message}</span>
            <button onClick={retry}>retry</button>
          </div>
        )}
      >
        <div>children</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('error: network down')).toBeDefined();
    });
    expect(screen.queryByText('children')).toBeNull();
  });

  it('retry() from errorFallback re-invokes fetchPermissions and recovers', async () => {
    let call = 0;
    const fetchPermissions = vi.fn(() => {
      call++;
      if (call === 1) return Promise.reject(new Error('boom'));
      return Promise.resolve(perms());
    });

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        errorFallback={(error, retry) => <button onClick={retry}>retry {error.message}</button>}
      >
        <div>children-loaded</div>
      </PermXProvider>,
    );

    const button = await screen.findByText(/retry boom/);
    await act(async () => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('children-loaded')).toBeDefined();
    });
    expect(fetchPermissions).toHaveBeenCalledTimes(2);
  });

  it('falls back to `fallback` when errorFallback is not provided', async () => {
    const fetchPermissions = vi.fn(() => Promise.reject(new Error('x')));

    render(
      <PermXProvider fetchPermissions={fetchPermissions} fallback={<div>loading</div>}>
        <div>children</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('loading')).toBeDefined();
    });
  });

  it('calls onError when fetch fails', async () => {
    const onError = vi.fn();
    const fetchPermissions = vi.fn(() => Promise.reject(new Error('boom')));

    render(
      <PermXProvider fetchPermissions={fetchPermissions} onError={onError}>
        <div>children</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
    });
  });
});

describe('usePermXRefresh', () => {
  it('refresh() re-fetches and updates permissions', async () => {
    let call = 0;
    const fetchPermissions = vi.fn(() => {
      call++;
      return Promise.resolve(
        perms({ permissions: call === 1 ? ['posts.view.all'] : ['posts.view.all', 'posts.edit.all'] }),
      );
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return <PermXProvider fetchPermissions={fetchPermissions}>{children}</PermXProvider>;
    }

    const { result } = renderHook(
      () => ({
        canEdit: useHasPermission('posts.edit.all'),
        refresh: usePermXRefresh(),
      }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.canEdit).toBe(false));

    let refreshResult: { ok: boolean } | undefined;
    await act(async () => {
      refreshResult = await result.current.refresh();
    });

    expect(refreshResult?.ok).toBe(true);
    expect(fetchPermissions).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.canEdit).toBe(true));
  });

  it('refresh() reports the error when fetch fails', async () => {
    let call = 0;
    const fetchPermissions = vi.fn(() => {
      call++;
      if (call === 1) return Promise.resolve(perms());
      return Promise.reject(new Error('refresh failed'));
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return <PermXProvider fetchPermissions={fetchPermissions}>{children}</PermXProvider>;
    }

    const { result } = renderHook(() => usePermXRefresh(), { wrapper: Wrapper });

    // Wait for initial load to complete so the hook is registered
    await waitFor(() => expect(result.current).toBeTypeOf('function'));

    let refreshResult: { ok: boolean; error?: Error } | undefined;
    await act(async () => {
      refreshResult = (await result.current()) as { ok: boolean; error?: Error };
    });

    expect(refreshResult?.ok).toBe(false);
    expect(refreshResult?.error?.message).toBe('refresh failed');
  });
});

describe('usePermXError', () => {
  it('exposes the error from a failed refresh (after initial successful load)', async () => {
    let call = 0;
    const fetchPermissions = vi.fn(() => {
      call++;
      if (call === 1) return Promise.resolve(perms());
      return Promise.reject(new Error('oops'));
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return <PermXProvider fetchPermissions={fetchPermissions}>{children}</PermXProvider>;
    }

    const { result } = renderHook(
      () => ({ error: usePermXError(), refresh: usePermXRefresh() }),
      { wrapper: Wrapper },
    );

    // Wait for initial successful hydration so children (and the hook) render
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.error?.message).toBe('oops'));
  });

  it('returns null when fetch succeeds', async () => {
    const fetchPermissions = vi.fn(() => Promise.resolve(perms()));

    function Wrapper({ children }: { children: ReactNode }) {
      return <PermXProvider fetchPermissions={fetchPermissions}>{children}</PermXProvider>;
    }

    const { result } = renderHook(() => usePermXError(), { wrapper: Wrapper });

    await waitFor(() => {
      // hook returns null after successful hydrate
      expect(result.current).toBeNull();
    });
  });
});
