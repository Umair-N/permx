import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouteGuard } from '../../src/components/route-guard.js';
import { makeWrapper } from '../helpers.js';

describe('RouteGuard', () => {
  it('renders children when routeId is allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: ['/dashboard'], components: [], fields: [] } },
    });
    render(
      <Wrapper>
        <RouteGuard routeId="/dashboard">VISIBLE</RouteGuard>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('VISIBLE')).toBeDefined());
  });

  it('renders fallback when routeId is not allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    render(
      <Wrapper>
        <RouteGuard routeId="/dashboard" fallback={<span>DENIED</span>}>
          VISIBLE
        </RouteGuard>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('DENIED')).toBeDefined());
    expect(screen.queryByText('VISIBLE')).toBeNull();
  });

  it('renders null when no fallback and denied', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    const { container } = render(
      <Wrapper>
        <RouteGuard routeId="/dashboard">VISIBLE</RouteGuard>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.queryByText('VISIBLE')).toBeNull());
    expect(container.textContent).toBe('');
  });

  it('renders children when superAdmin is true', async () => {
    const Wrapper = makeWrapper({
      superAdmin: true,
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    render(
      <Wrapper>
        <RouteGuard routeId="/anywhere">VISIBLE</RouteGuard>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('VISIBLE')).toBeDefined());
  });
});
