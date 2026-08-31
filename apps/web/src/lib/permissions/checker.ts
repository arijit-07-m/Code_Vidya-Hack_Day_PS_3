import { Permission } from './types';

/**
 * Check if a set of permissions includes a specific permission.
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Filter navigation items based on user permissions.
 */
export function filterNavItems(
  items: { permission?: Permission; label: string }[],
  userPermissions: Permission[]
): { permission?: Permission; label: string }[] {
  return items.filter(item => !item.permission || hasPermission(userPermissions, item.permission));
}

/**
 * Get effective permissions combining role permissions + additional permissions.
 */
export function getEffectivePermissions(
  rolePermissions: Permission[],
  additionalPermissions: Permission[]
): Permission[] {
  const combined = [...rolePermissions, ...additionalPermissions];
  return Array.from(new Set(combined));
}