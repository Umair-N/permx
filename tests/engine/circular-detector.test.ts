import { describe, it, expect } from 'vitest';
import { detectCircularInheritance } from '../../src/engine/circular-detector.js';

describe('detectCircularInheritance', () => {
  it('returns false for no parents', async () => {
    const result = await detectCircularInheritance('role-1', [], async () => []);
    expect(result.circular).toBe(false);
  });

  it('detects direct self-reference', async () => {
    const result = await detectCircularInheritance('role-1', ['role-1'], async () => []);
    expect(result.circular).toBe(true);
  });

  it('detects indirect cycle', async () => {
    const parents: Record<string, string[]> = {
      'role-b': ['role-c'],
      'role-c': ['role-a'],
    };

    const fetchParents = async (id: string) => parents[id] ?? [];
    const result = await detectCircularInheritance('role-a', ['role-b'], fetchParents);
    expect(result.circular).toBe(true);
  });

  it('allows valid inheritance', async () => {
    const parents: Record<string, string[]> = {
      'role-b': ['role-c'],
      'role-c': [],
    };

    const fetchParents = async (id: string) => parents[id] ?? [];
    const result = await detectCircularInheritance('role-a', ['role-b'], fetchParents);
    expect(result.circular).toBe(false);
  });

  it('detects cycle with chain info', async () => {
    const parents: Record<string, string[]> = {
      'role-b': ['role-a'],
    };

    const fetchParents = async (id: string) => parents[id] ?? [];
    const result = await detectCircularInheritance('role-a', ['role-b'], fetchParents);
    expect(result.circular).toBe(true);
    expect(result.chain).toBeDefined();
  });

  it('works for new roles', async () => {
    const parents: Record<string, string[]> = {
      'role-b': [],
    };

    const fetchParents = async (id: string) => parents[id] ?? [];
    const result = await detectCircularInheritance('new', ['role-b'], fetchParents);
    expect(result.circular).toBe(false);
  });
});
