export const ROLE_TYPES = ['regular', 'subscription', 'feature_flag'] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

export interface RolePropagation {
  template_version: number;
  propagated_at: Date;
  changes: string;
  permissions_added: string[];
  permissions_removed: string[];
}

export interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  inherits_from: string[];
  permissions: string[];
  is_system_role: boolean;
  template_id: string | null;
  template_version: number | null;
  is_customized: boolean;
  role_type: RoleType;
  active: boolean;
  expires_at?: Date;
  last_propagation?: RolePropagation;
}
