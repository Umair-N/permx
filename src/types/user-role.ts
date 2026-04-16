export interface UserRole {
  _id: string;
  user_id: string;
  role: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  excluded_permissions: string[];
  additional_permissions: string[];
}

export interface UserRolePopulated {
  _id: string;
  user_id: string;
  role: {
    _id: string;
    role_type: string;
    permissions: Array<{ _id: string; key: string }>;
    inherits_from: string[];
  };
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  excluded_permissions: string[];
  additional_permissions: string[];
}
