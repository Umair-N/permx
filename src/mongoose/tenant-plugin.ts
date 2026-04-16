import type { Schema } from 'mongoose';

export interface TenantPluginOptions {
  tenantIdField?: string;
  exempt?: boolean;
}

/**
 * Lightweight tenant isolation plugin for Mongoose.
 *
 * When enabled, adds a `tenantId` field to the schema and auto-filters
 * find/count/update/delete queries by tenantId. The consumer sets tenantId
 * on each document at creation time.
 *
 * No AsyncLocalStorage — tenantId is passed explicitly via the document or query.
 */
export function tenantPlugin(schema: Schema, options: TenantPluginOptions = {}): void {
  const field_name = options.tenantIdField ?? 'tenantId';

  if (options.exempt) return;

  schema.add({
    [field_name]: {
      type: 'ObjectId',
      required: [true, `${field_name} is required for tenant isolation`],
      index: true,
    },
  });
}
