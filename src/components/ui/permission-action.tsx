import type { ReactNode } from "react";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  type PlatformPermission,
  type ResourceScope,
} from "@/modules/permissions/policy";

export function PermissionAction({
  context,
  permission,
  resource,
  children,
  fallback = null,
}: {
  context: RequestContext;
  permission: PlatformPermission;
  resource?: ResourceScope;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return can(context, permission, resource) ? children : fallback;
}
