import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TtlCache } from '../../src/cache/ttl-cache.js';

describe('TtlCache', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('stores and retrieves values', () => {
    const cache = new TtlCache<string>(5000);
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('returns undefined for missing keys', () => {
    const cache = new TtlCache<string>(5000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('key', 'value');

    expect(cache.get('key')).toBe('value');

    vi.advanceTimersByTime(1001);
    expect(cache.get('key')).toBeUndefined();
  });

  it('invalidates specific keys', () => {
    const cache = new TtlCache<string>(5000);
    cache.set('a', '1');
    cache.set('b', '2');

    cache.invalidate('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
  });

  it('clears all entries', () => {
    const cache = new TtlCache<string>(5000);
    cache.set('a', '1');
    cache.set('b', '2');

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('tracks size correctly', () => {
    const cache = new TtlCache<string>(5000);
    expect(cache.size).toBe(0);

    cache.set('a', '1');
    expect(cache.size).toBe(1);

    cache.set('b', '2');
    expect(cache.size).toBe(2);
  });

  it('overwrites existing keys', () => {
    const cache = new TtlCache<string>(5000);
    cache.set('key', 'old');
    cache.set('key', 'new');

    expect(cache.get('key')).toBe('new');
    expect(cache.size).toBe(1);
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when maxSize exceeded', () => {
      const cache = new TtlCache<string>(5000, 2);
      cache.set('A', '1');
      cache.set('B', '2');
      cache.set('C', '3');

      expect(cache.get('A')).toBeUndefined();
      expect(cache.get('B')).toBe('2');
      expect(cache.get('C')).toBe('3');
    });

    it('promotes accessed entries (LRU order)', () => {
      const cache = new TtlCache<string>(5000, 2);
      cache.set('A', '1');
      cache.set('B', '2');

      // Access A to promote it to most-recent
      cache.get('A');

      // Adding C should evict B (least recently used), not A
      cache.set('C', '3');

      expect(cache.get('A')).toBe('1');
      expect(cache.get('B')).toBeUndefined();
      expect(cache.get('C')).toBe('3');
    });

    it('evicts expired entries before LRU when at capacity', () => {
      const cache = new TtlCache<string>(1000, 2);
      cache.set('A', '1');
      cache.set('B', '2');

      // Expire A
      vi.advanceTimersByTime(1001);

      // Adding C should clean expired A first, keeping B
      cache.set('C', '3');

      expect(cache.get('A')).toBeUndefined();
      expect(cache.get('B')).toBeUndefined(); // B also expired
      expect(cache.get('C')).toBe('3');
    });
  });

  describe('has', () => {
    it('returns true for valid entry', () => {
      const cache = new TtlCache<string>(5000);
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('returns false for expired entry', () => {
      const cache = new TtlCache<string>(1000);
      cache.set('key', 'value');

      vi.advanceTimersByTime(1001);
      expect(cache.has('key')).toBe(false);
    });

    it('returns false for missing key', () => {
      const cache = new TtlCache<string>(5000);
      expect(cache.has('missing')).toBe(false);
    });
  });

  it('size excludes expired entries', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('a', '1');

    // Set b with a fresh TTL by advancing half the time first
    vi.advanceTimersByTime(500);
    cache.set('b', '2');

    // Advance past a's expiry but not b's
    vi.advanceTimersByTime(501);

    expect(cache.size).toBe(1);
  });

  it('works unbounded when maxSize not set', () => {
    const cache = new TtlCache<string>(5000);

    for (let i = 0; i < 100; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }

    expect(cache.size).toBe(100);
    expect(cache.get('key-0')).toBe('value-0');
    expect(cache.get('key-99')).toBe('value-99');
  });
});
