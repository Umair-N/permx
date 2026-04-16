import type { PermXDataProvider, SubscriptionResolver } from '../types/data-provider.js';
import type { EffectivePermissions } from '../types/context.js';
import type { Permission, StructuredPermission } from '../types/permission.js';
import { resolveRolePermissions } from './role-resolver.js';

/**
 * Computes the full effective permission set for a user.
 *
 * Three-layer model (pure union):
 * - Regular roles: what the user's job function allows (UNION of all assigned roles)
 * - Subscription roles: what the tenant's plan paid for (feature flags)
 * - Effective = regular UNION subscription (independent dimensions)
 *
 * Per-user overrides:
 * - excluded_permissions: keys removed from the effective set
 * - additional_permissions: IDs added to the effective set
 *
 * Ported from Sahal's `get_user_effective_permissions` in user-role.logic.ts
 * Decoupled from all Mongoose models — uses PermXDataProvider interface.
 */
export async function getUserEffectivePermissions(
  userId: string,
  provider: PermXDataProvider,
  subscriptionResolver?: SubscriptionResolver,
  tenantId?: string,
): Promise<EffectivePermissions> {
  // 1. Get user's role assignments (tenant-scoped)
  const assignments = await provider.getUserRoles(userId);

  // 2. Resolve subscription permissions (if SaaS app provides resolver)
  const sub_perm_ids = new Set<string>();
  if (subscriptionResolver && tenantId) {
    const ids = await subscriptionResolver(tenantId);
    ids.forEach((id) => sub_perm_ids.add(id));
  }

  // 3. Resolve regular permissions from assignments (UNION)
  const reg_perm_ids = new Set<string>();
  const all_excluded_keys = new Set<string>();

  const fetchRole = (roleId: string) => provider.getRoleForResolution(roleId);

  const reg_assignments = assignments.filter(
    (a) => a.role?.role_type !== 'subscription',
  );

  for (const assignment of reg_assignments) {
    const role_ref = assignment.role?._id;
    if (!role_ref) continue;

    const role_perms = await resolveRolePermissions(role_ref, fetchRole);
    role_perms.forEach((p) => reg_perm_ids.add(p));

    if (assignment.excluded_permissions?.length) {
      assignment.excluded_permissions.forEach((key) =>
        all_excluded_keys.add(key),
      );
    }

    if (assignment.additional_permissions?.length) {
      assignment.additional_permissions.forEach((p) =>
        reg_perm_ids.add(p),
      );
    }
  }

  // 4. Pure union: regular UNION subscription
  const effective_ids = new Set([...reg_perm_ids, ...sub_perm_ids]);
  const permission_id_array = Array.from(effective_ids);

  const permissions = await provider.getPermissionsByIds(permission_id_array);

  // 5. Build response with UI mappings
  const permission_keys: string[] = [];
  const structured_permissions: StructuredPermission[] = [];
  const routes: string[] = [];
  const components: string[] = [];
  const fields: string[] = [];
  const module_ids = new Set<string>();

  const is_excluded = (perm: Permission): boolean =>
    all_excluded_keys.has(perm.key) || all_excluded_keys.has(perm._id);

  for (const perm of permissions) {
    if (is_excluded(perm)) continue;
    module_ids.add(perm.module);
  }

  const module_id_array = Array.from(module_ids);
  const modules = await provider.getModulesByIds(module_id_array);

  const module_slug_by_id = new Map<string, string>();
  for (const mod of modules) {
    module_slug_by_id.set(mod._id, mod.slug);
  }

  for (const perm of permissions) {
    if (is_excluded(perm)) continue;

    permission_keys.push(perm.key);

    const module_slug = module_slug_by_id.get(perm.module) ?? '';
    structured_permissions.push({
      key: perm.key,
      module_slug,
      resource: perm.resource,
      action: perm.action,
      scope: perm.scope,
      field: perm.field,
    });

    for (const ui of perm.ui_mappings) {
      if (ui.type === 'route') routes.push(ui.identifier);
      else if (ui.type === 'component') components.push(ui.identifier);
      else if (ui.type === 'field') fields.push(ui.identifier);
    }
  }

  return {
    permissions: permission_keys,
    structured_permissions,
    ui_mappings: {
      routes: [...new Set(routes)],
      components: [...new Set(components)],
      fields: [...new Set(fields)],
    },
    modules,
  };
}
