import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CanField } from '../../src/components/can-field.js';
import { makeWrapper } from '../helpers.js';

describe('CanField', () => {
  it('renders children when fieldId is allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: [], components: [], fields: ['client-email'] } },
    });
    render(
      <Wrapper>
        <CanField fieldId="client-email">VISIBLE</CanField>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('VISIBLE')).toBeDefined());
  });

  it('renders fallback when fieldId is not allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { ui_mappings: { routes: [], components: [], fields: [] } },
    });
    render(
      <Wrapper>
        <CanField fieldId="client-email" fallback={<span>DENIED</span>}>
          VISIBLE
        </CanField>
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
        <CanField fieldId="client-email">VISIBLE</CanField>
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
        <CanField fieldId="anything-at-all">VISIBLE</CanField>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('VISIBLE')).toBeDefined());
  });
});
