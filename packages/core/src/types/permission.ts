export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'manage',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_SCOPES = [
  'all',
  'own',
  'team',
  'department',
  'self',
  'public',
  'admin',
] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

export interface ApiMapping {
  service: string;
  method: string;
  path: string;
}

export interface UiMapping {
  type: 'route' | 'component' | 'field';
  identifier: string;
}

export interface Permission {
  _id: string;
  module: string;
  name: string;
  key: string;
  description?: string;
  api_mappings: ApiMapping[];
  ui_mappings: UiMapping[];
  resource?: string;
  action?: PermissionAction;
  scope?: PermissionScope;
  field?: string;
}

export interface ParsedPermissionKey {
  module: string;
  resource: string;
  action: string;
  scope?: string;
  field?: string;
}

export interface StructuredPermission {
  key: string;
  module_slug: string;
  resource?: string;
  action?: string;
  scope?: string;
  field?: string;
}
