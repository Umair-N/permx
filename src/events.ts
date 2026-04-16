import { EventEmitter } from 'node:events';

export interface PermXEventMap {
  'authorize': { userId: string; permissionKey: string; authorized: boolean; duration_ms: number };
  'authorize.denied': { userId: string; permissionKey: string };
  'authorize.error': { userId: string; permissionKey?: string; error: unknown };
  'cache.hit': { key: string };
  'cache.miss': { key: string };
}

export type PermXEventName = keyof PermXEventMap;

/**
 * Typed event emitter for PermX observability.
 *
 * Emits authorization decisions, cache events, and errors.
 * Consumers attach listeners for audit trails, metrics, and logging.
 */
export class PermXEmitter extends EventEmitter {
  override emit<K extends PermXEventName>(event: K, payload: PermXEventMap[K]): boolean {
    return super.emit(event as string, payload);
  }

  override on<K extends PermXEventName>(event: K, listener: (payload: PermXEventMap[K]) => void): this {
    return super.on(event as string, listener);
  }

  override off<K extends PermXEventName>(event: K, listener: (payload: PermXEventMap[K]) => void): this {
    return super.off(event as string, listener);
  }

  override once<K extends PermXEventName>(event: K, listener: (payload: PermXEventMap[K]) => void): this {
    return super.once(event as string, listener);
  }
}
