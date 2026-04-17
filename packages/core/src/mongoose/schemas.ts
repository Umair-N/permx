import mongoose from 'mongoose';
import { PERMISSION_ACTIONS, PERMISSION_SCOPES } from '../types/permission.js';
import { tenantPlugin } from './tenant-plugin.js';

export interface SchemaFactoryConfig {
  /** Rename collection names. Defaults: module, permission, role, userRole */
  collections?: {
    module?: string;
    permission?: string;
    role?: string;
    userRole?: string;
  };

  /** Extend schemas with custom fields */
  extend?: {
    module?: Record<string, unknown>;
    permission?: Record<string, unknown>;
    role?: Record<string, unknown>;
    userRole?: Record<string, unknown>;
  };

  /** Multi-tenancy configuration */
  tenancy?: {
    enabled: boolean;
    tenantIdField?: string;
    exemptModels?: Array<'module' | 'permission'>;
  };
}

export interface PermXModels {
  Module: mongoose.Model<any>;
  Permission: mongoose.Model<any>;
  Role: mongoose.Model<any>;
  UserRole: mongoose.Model<any>;
}

/**
 * Create PermX Mongoose schemas and register them on the given connection.
 *
 * Better-Auth pattern: SDK defines schemas, consumer controls naming,
 * extends with custom fields, and opts into multi-tenancy.
 */
export function createPermXSchemas(
  connection: mongoose.Connection,
  config: SchemaFactoryConfig = {},
): PermXModels {
  const collections = config.collections ?? {};
  const extend = config.extend ?? {};
  const tenancy = config.tenancy ?? { enabled: false };
  const tenant_field = tenancy.tenantIdField ?? 'tenantId';
  const exempt_models = new Set(tenancy.exemptModels ?? ['module', 'permission']);

  // Resolve model names upfront so refs are correct at schema creation time
  const model_name_module = collections.module ?? 'PermX_Module';
  const model_name_permission = collections.permission ?? 'PermX_Permission';
  const model_name_role = collections.role ?? 'PermX_Role';
  const model_name_user_role = collections.userRole ?? 'PermX_UserRole';

  const apply_tenant = (schema: mongoose.Schema, modelKey: string) => {
    if (tenancy.enabled) {
      tenantPlugin(schema, {
        tenantIdField: tenant_field,
        exempt: exempt_models.has(modelKey),
      });
    }
  };

  // ── Module ──────────────────────────────────────────────
  const module_schema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
      description: { type: String, trim: true },
      icon: { type: String, trim: true },
      sort_order: { type: Number, required: true, default: 0 },
      active: { type: Boolean, required: true, default: true },
      ...(extend.module ?? {}),
    },
    { timestamps: true },
  );

  module_schema.pre('save', function (next) {
    if (this.isModified('slug') && this.slug) {
      this.slug = this.slug.replace(/\s+/g, '-').toLowerCase();
    }
    next();
  });

  apply_tenant(module_schema, 'module');

  // ── Permission ──────────────────────────────────────────
  const api_mapping_schema = new mongoose.Schema(
    {
      service: { type: String, required: true, trim: true },
      method: { type: String, required: true, trim: true, uppercase: true },
      path: { type: String, required: true, trim: true },
    },
    { _id: false },
  );

  const ui_mapping_schema = new mongoose.Schema(
    {
      type: { type: String, required: true, enum: ['route', 'component', 'field'] },
      identifier: { type: String, required: true, trim: true },
    },
    { _id: false },
  );

  const permission_schema = new mongoose.Schema(
    {
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: model_name_module,
        required: true,
      },
      name: { type: String, required: true, trim: true },
      key: { type: String, required: true, unique: true, trim: true, lowercase: true },
      description: { type: String, trim: true },
      api_mappings: { type: [api_mapping_schema], default: [] },
      ui_mappings: { type: [ui_mapping_schema], default: [] },
      resource: {
        type: String, trim: true, lowercase: true,
        match: [/^[a-z0-9-]+$/, 'resource must be lowercase alphanumeric with dashes'],
      },
      action: { type: String, enum: PERMISSION_ACTIONS, lowercase: true },
      scope: { type: String, enum: PERMISSION_SCOPES, lowercase: true },
      field: {
        type: String, trim: true, lowercase: true,
        match: [/^[a-z0-9-]+$/, 'field must be lowercase alphanumeric with dashes'],
      },
      ...(extend.permission ?? {}),
    },
    { timestamps: true },
  );

  permission_schema.index({ module: 1 });
  permission_schema.index(
    { module: 1, resource: 1, action: 1, scope: 1, field: 1 },
    { partialFilterExpression: { resource: { $type: 'string' }, action: { $type: 'string' } } },
  );

  permission_schema.pre('save', function (next) {
    if (this.isModified('key') && this.key) {
      this.key = this.key.replace(/\s+/g, '.').toLowerCase();
    }
    next();
  });

  apply_tenant(permission_schema, 'permission');

  // ── Role ────────────────────────────────────────────────
  const role_schema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, lowercase: true, trim: true },
      description: { type: String, trim: true },
      inherits_from: [{ type: mongoose.Schema.Types.ObjectId, ref: model_name_role }],
      permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: model_name_permission }],
      is_system_role: { type: Boolean, required: true, default: false },
      template_id: { type: mongoose.Schema.Types.ObjectId, default: null },
      template_version: { type: Number, default: null },
      is_customized: { type: Boolean, default: false },
      role_type: { type: String, enum: ['regular', 'subscription', 'feature_flag'], default: 'regular', required: true },
      active: { type: Boolean, required: true, default: true },
      expires_at: { type: Date, default: undefined },
      last_propagation: {
        type: {
          template_version: { type: Number },
          propagated_at: { type: Date },
          changes: { type: String },
          permissions_added: [{ type: String }],
          permissions_removed: [{ type: String }],
        },
        default: undefined,
      },
      ...(extend.role ?? {}),
    },
    { timestamps: true },
  );

  role_schema.pre('save', function (next) {
    if (this.isModified('slug') && this.slug) {
      this.slug = this.slug.replace(/\s+/g, '-').toLowerCase();
    }
    next();
  });

  apply_tenant(role_schema, 'role');

  // Indexes — tenantId-scoped if tenancy enabled
  if (tenancy.enabled) {
    role_schema.index({ [tenant_field]: 1, name: 1 }, { unique: true });
    role_schema.index({ [tenant_field]: 1, slug: 1 }, { unique: true });
    role_schema.index({ [tenant_field]: 1, role_type: 1 });
  } else {
    role_schema.index({ name: 1 }, { unique: true });
    role_schema.index({ slug: 1 }, { unique: true });
    role_schema.index({ role_type: 1 });
  }

  // ── UserRole ────────────────────────────────────────────
  const user_role_schema = new mongoose.Schema(
    {
      user_id: { type: String, required: true, trim: true },
      role: { type: mongoose.Schema.Types.ObjectId, ref: model_name_role, required: true },
      assigned_by: { type: String, trim: true },
      assigned_at: { type: Date, required: true, default: Date.now },
      expires_at: { type: Date, default: undefined },
      excluded_permissions: { type: [{ type: String, trim: true }], default: [] },
      additional_permissions: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: model_name_permission }],
        default: [],
      },
      ...(extend.userRole ?? {}),
    },
    { timestamps: true },
  );

  if (tenancy.enabled) {
    user_role_schema.index({ [tenant_field]: 1, user_id: 1, role: 1 }, { unique: true });
  } else {
    user_role_schema.index({ user_id: 1, role: 1 }, { unique: true });
  }

  apply_tenant(user_role_schema, 'userRole');

  // ── Register models ─────────────────────────────────────
  return {
    Module: connection.model(model_name_module, module_schema),
    Permission: connection.model(model_name_permission, permission_schema),
    Role: connection.model(model_name_role, role_schema),
    UserRole: connection.model(model_name_user_role, user_role_schema),
  };
}
