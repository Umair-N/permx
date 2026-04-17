import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Can } from '../../src/components/can.js';
import { makeWrapper } from '../helpers.js';

describe('Can', () => {
  it('renders children when componentId is allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: [], components: ['client-table'], fields: [] } },
    });
    render(
      <Wrapper>
        <Can componentId="client-table">VISIBLE</Can>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('VISIBLE')).toBeDefined());
  });

  it('renders fallback when componentId is not allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    render(
      <Wrapper>
        <Can componentId="client-table" fallback={<span>DENIED</span>}>
          VISIBLE
        </Can>
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
        <Can componentId="client-table">VISIBLE</Can>
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
        <Can componentId="anything-at-all">VISIBLE</Can>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('VISIBLE')).toBeDefined());
  });

  it('throws when used outside PermXProvider', () => {
    const originalError = console.error;
    console.error = () => {};
    try {
      expect(() =>
        render(<Can componentId="client-table">VISIBLE</Can>),
      ).toThrow();
    } finally {
      console.error = originalError;
    }
  });
});
