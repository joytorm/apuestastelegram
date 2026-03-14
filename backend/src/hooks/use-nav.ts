'use client';

/**
 * Fully client-side hook for filtering navigation items based on RBAC
 *
 * This hook uses the Supabase auth context to check permissions, roles, and organization
 * without any server calls. This is perfect for navigation visibility (UX only).
 *
 * Performance:
 * - All checks are synchronous (no server calls)
 * - Instant filtering
 * - No loading states
 * - No UI flashing
 *
 * Note: For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */

import { useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { NavItem } from '@/types';

/**
 * Hook to filter navigation items based on RBAC (fully client-side)
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { organization, user, permissions, role, hasOrg } = useAuth();

  // Memoize context
  const accessContext = useMemo(() => {
    return {
      organization: organization ?? undefined,
      user: user ?? undefined,
      permissions,
      role: role ?? undefined,
      hasOrg
    };
  }, [organization?.id, user?.id, permissions, role, hasOrg]);

  // Filter items synchronously (all client-side)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // No access restrictions
        if (!item.access) {
          return true;
        }

        // Check requireOrg
        if (item.access.requireOrg && !accessContext.hasOrg) {
          return false;
        }

        // Check permission
        if (item.access.permission) {
          if (!accessContext.hasOrg) {
            return false;
          }
          if (!accessContext.permissions.includes(item.access.permission)) {
            return false;
          }
        }

        // Check role
        if (item.access.role) {
          if (!accessContext.hasOrg) {
            return false;
          }
          if (accessContext.role !== item.access.role) {
            return false;
          }
        }

        // Plan/feature checks - show item and let page-level protection handle it
        if (item.access.plan || item.access.feature) {
          console.warn(
            `Plan/feature checks for navigation items require server-side verification. ` +
              `Item "${item.title}" will be shown, but page-level protection should be implemented.`
          );
        }

        return true;
      })
      .map((item) => {
        // Recursively filter child items
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((childItem) => {
            // No access restrictions
            if (!childItem.access) {
              return true;
            }

            // Check requireOrg
            if (childItem.access.requireOrg && !accessContext.hasOrg) {
              return false;
            }

            // Check permission
            if (childItem.access.permission) {
              if (!accessContext.hasOrg) {
                return false;
              }
              if (
                !accessContext.permissions.includes(childItem.access.permission)
              ) {
                return false;
              }
            }

            // Check role
            if (childItem.access.role) {
              if (!accessContext.hasOrg) {
                return false;
              }
              if (accessContext.role !== childItem.access.role) {
                return false;
              }
            }

            // Plan/feature checks (same warning as above)
            if (childItem.access.plan || childItem.access.feature) {
              console.warn(
                `Plan/feature checks for navigation items require server-side verification. ` +
                  `Item "${childItem.title}" will be shown, but page-level protection should be implemented.`
              );
            }

            return true;
          });

          return {
            ...item,
            items: filteredChildren
          };
        }

        return item;
      });
  }, [items, accessContext]);

  return filteredItems;
}
