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
  fallback,
  deniedMode = "show-reason",
}: {
  context: RequestContext;
  permission: PlatformPermission;
  resource?: ResourceScope;
  children: ReactNode;
  fallback?: ReactNode;
  /** Explicitly choose hide-sensitive only for audited privacy/authorization cases. */
  deniedMode?: "show-reason" | "hide-sensitive";
}) {
  if (can(context, permission, resource)) return children;
  if (fallback !== undefined) return fallback;
  if (deniedMode === "hide-sensitive") return null;
  return <span data-slot="permission-denied" role="note" className="block rounded-[9px] border border-[#e5e9f0] bg-[#fafbfc] px-4 py-3 text-[13px] leading-5 text-[#54505d]">You do not have permission to perform this action.</span>;
}
