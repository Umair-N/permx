import type { PermissionAction, PermissionScope, ApiMapping, UiMapping } from '../types/permission.js';
import type { RoleType } from '../types/role.js';

/** Input for creating a module via `permx.createModule()` */
export interface CreateModuleInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  active?: boolean;
}

/** Input for creating a permission via `permx.createPermission()` */
export interface CreatePermissionInput {
  module: string;
  name: string;
  key: string;
  description?: string;
  api_mappings?: ApiMapping[];
  ui_mappings?: UiMapping[];
  resource?: string;
  action?: PermissionAction;
  scope?: PermissionScope;
  field?: string;
}

/** Input for creating a role via `permx.createRole()` */
export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  permissions?: string[];
  inherits_from?: string[];
  role_type?: RoleType;
  is_system_role?: boolean;
  active?: boolean;
  expires_at?: Date;
}

/** Input for assigning a role to a user via `permx.assignRole()` */
export interface AssignRoleInput {
  user_id: string;
  role: string;
  assigned_by?: string;
  expires_at?: Date;
  excluded_permissions?: string[];
  additional_permissions?: string[];
}

/** Returned from convenience methods — the created document with its _id */
export interface CreatedDocument {
  _id: string;
  [key: string]: unknown;
}
