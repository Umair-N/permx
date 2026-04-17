import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureGate } from '../../src/components/feature-gate.js';
import { makeWrapper } from '../helpers.js';

describe('FeatureGate', () => {
  it('renders children when permission is allowed', async () => {
    const Wrapper = makeWrapper({
      permissions: { permissions: ['subscription.sso'] },
    });
    render(
      <Wrapper>
        <FeatureGate permission="subscription.sso">FEATURE</FeatureGate>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('FEATURE')).toBeDefined());
  });

  it('renders fallback when denied and no overlay', async () => {
    const Wrapper = makeWrapper({
      permissions: { permissions: [] },
    });
    render(
      <Wrapper>
        <FeatureGate permission="subscription.sso" fallback={<span>UPGRADE</span>}>
          FEATURE
        </FeatureGate>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('UPGRADE')).toBeDefined());
    expect(screen.queryByText('FEATURE')).toBeNull();
  });

  it('renders children AND overlay when denied with renderOverlay', async () => {
    const Wrapper = makeWrapper({
      permissions: { permissions: [] },
    });
    render(
      <Wrapper>
        <FeatureGate
          permission="subscription.sso"
          renderOverlay={() => <span>OVERLAY</span>}
        >
          FEATURE
        </FeatureGate>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('OVERLAY')).toBeDefined());
    expect(screen.getByText('FEATURE')).toBeDefined();
  });

  it('renders children when superAdmin', async () => {
    const Wrapper = makeWrapper({
      superAdmin: true,
      permissions: { permissions: [] },
    });
    render(
      <Wrapper>
        <FeatureGate permission="any.permission">FEATURE</FeatureGate>
      </Wrapper>,
    );
    await waitFor(() => expect(screen.getByText('FEATURE')).toBeDefined());
  });
});
