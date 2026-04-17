import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PermXProvider } from '../src/provider.js';
import { useHasPermission } from '../src/hooks/use-has-permission.js';
import type { EffectivePermissions } from '@permx/core';

function makePermissions(
  overrides: Partial<EffectivePermissions> = {},
): EffectivePermissions {
  return {
    permissions: ['clients.view.all', 'invoices.create.own'],
    structured_permissions: [],
    ui_mappings: {
      routes: ['/dashboard', '/clients'],
      components: ['client-table', 'sidebar-nav'],
      fields: ['client-email', 'client-phone'],
    },
    modules: [
      {
        _id: 'm1',
        name: 'Clients',
        slug: 'clients',
        sort_order: 1,
        active: true,
      },
    ],
    ...overrides,
  };
}

const makeFetch = (data?: EffectivePermissions, delay = 0) => {
  return vi.fn(
    () =>
      new Promise<EffectivePermissions>((resolve) => {
        setTimeout(() => resolve(data ?? makePermissions()), delay);
      }),
  );
};

const makeFailingFetch = (err: unknown) => {
  return vi.fn(() => Promise.reject(err));
};

describe('<PermXProvider>', () => {
  it('renders fallback while fetch is pending', () => {
    const fetchPermissions = makeFetch(undefined, 50);

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        fallback={<div>loading...</div>}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    expect(screen.getByText('loading...')).toBeDefined();
    expect(screen.queryByText('children-content')).toBeNull();
  });

  it('renders children after fetch resolves', async () => {
    const fetchPermissions = makeFetch();

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        fallback={<div>loading...</div>}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('children-content')).toBeDefined();
    });
    expect(screen.queryByText('loading...')).toBeNull();
  });

  it('calls onError when fetch rejects, keeps fallback visible', async () => {
    const onError = vi.fn();
    const fetchPermissions = makeFailingFetch(new Error('boom'));

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        fallback={<div>loading...</div>}
        onError={onError}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe('boom');
    expect(screen.getByText('loading...')).toBeDefined();
  });

  it('does not render children if fetch rejects (only fallback)', async () => {
    const onError = vi.fn();
    const fetchPermissions = makeFailingFetch(new Error('nope'));

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        fallback={<div>loading...</div>}
        onError={onError}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
    expect(screen.queryByText('children-content')).toBeNull();
    expect(screen.getByText('loading...')).toBeDefined();
  });

  it('renders nothing (null) by default when no fallback provided and loading', () => {
    const fetchPermissions = makeFetch(undefined, 50);

    const { container } = render(
      <PermXProvider fetchPermissions={fetchPermissions}>
        <div>children-content</div>
      </PermXProvider>,
    );

    expect(screen.queryByText('children-content')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('passes superAdmin flag through to store', async () => {
    const fetchPermissions = makeFetch(
      makePermissions({ permissions: [] }),
    );

    function Probe(): JSX.Element {
      const allowed = useHasPermission('anything.never.exists');
      return <div>result:{allowed ? 'yes' : 'no'}</div>;
    }

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        superAdmin={true}
        fallback={<div>loading...</div>}
      >
        <Probe />
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('result:yes')).toBeDefined();
    });
  });

  it('re-runs fetch when fetchPermissions reference changes', async () => {
    const firstFetch = makeFetch();
    const secondFetch = makeFetch();

    const { rerender } = render(
      <PermXProvider
        fetchPermissions={firstFetch}
        fallback={<div>loading...</div>}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(firstFetch).toHaveBeenCalledTimes(1);
    });

    rerender(
      <PermXProvider
        fetchPermissions={secondFetch}
        fallback={<div>loading...</div>}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(secondFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('wraps non-Error rejection values in Error before calling onError', async () => {
    const onError = vi.fn();
    const fetchPermissions = makeFailingFetch('string-rejection');

    render(
      <PermXProvider
        fetchPermissions={fetchPermissions}
        fallback={<div>loading...</div>}
        onError={onError}
      >
        <div>children-content</div>
      </PermXProvider>,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    const arg = onError.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Error);
    expect((arg as Error).message).toBe('string-rejection');
  });
});
