import type { EffectivePermissions } from '@permx/core';

/**
 * The currently selected user id (read via closure by fetchPermissions).
 * Swapping it + remounting PermXProvider triggers a fresh permissions fetch.
 */
export function createFetchPermissions(getUserId: () => string) {
  return async (): Promise<EffectivePermissions> => {
    const response = await fetch('/api/permissions/my', {
      headers: { 'x-user-id': getUserId() },
    });
    if (!response.ok) {
      throw new Error(`Failed to load permissions: ${response.status}`);
    }
    return response.json();
  };
}

export async function callProtectedApi(path: string, userId: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      'x-user-id': userId,
      ...(init?.headers ?? {}),
    },
  });
}
