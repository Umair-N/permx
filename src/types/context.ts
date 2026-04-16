import type { Module } from './module.js';
import type { StructuredPermission } from './permission.js';

export interface AuthResult {
  authorized: boolean;
  matched_key?: string;
}

export interface EffectivePermissions {
  permissions: string[];
  structured_permissions: StructuredPermission[];
  ui_mappings: {
    routes: string[];
    components: string[];
    fields: string[];
  };
  modules: Module[];
}
