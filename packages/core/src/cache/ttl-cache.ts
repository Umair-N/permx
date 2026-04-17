interface CacheEntry<T> {
  value: T;
  expires_at: number;
}

/**
 * Generic in-memory TTL cache with optional LRU eviction.
 *
 * When `max_size` is provided, the cache evicts expired entries first,
 * then the least-recently-used entry when at capacity.
 * JavaScript Map preserves insertion order — delete + re-insert on access
 * moves entries to the most-recent position.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttl_ms: number;
  private readonly max_size: number | undefined;

  constructor(ttl_ms: number, max_size?: number) {
    this.ttl_ms = ttl_ms;
    this.max_size = max_size;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires_at) {
      this.store.delete(key);
      return undefined;
    }

    // LRU promotion: delete and re-insert to move to most-recent position
    if (this.max_size !== undefined) {
      this.store.delete(key);
      this.store.set(key, entry);
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // If key already exists, delete first (resets insertion order)
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    if (this.max_size !== undefined && this.store.size >= this.max_size) {
      this.evict_expired();

      // If still at capacity after expired cleanup, evict LRU (oldest)
      while (this.store.size >= this.max_size) {
        const oldest_key = this.store.keys().next().value;
        if (oldest_key !== undefined) {
          this.store.delete(oldest_key);
        } else {
          break;
        }
      }
    }

    this.store.set(key, {
      value,
      expires_at: Date.now() + this.ttl_ms,
    });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires_at) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Returns the count of non-expired entries */
  get size(): number {
    const now = Date.now();
    let count = 0;
    for (const entry of this.store.values()) {
      if (now <= entry.expires_at) {
        count++;
      }
    }
    return count;
  }

  /** Remove all expired entries from the store */
  private evict_expired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expires_at) {
        this.store.delete(key);
      }
    }
  }
}
