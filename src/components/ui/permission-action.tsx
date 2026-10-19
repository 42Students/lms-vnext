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
  return <span data-slot="permission-denied" role="note" className="block min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] break-words text-[13px] leading-5 text-[var(--lms-body-text)]">You do not have permission to perform this action.</span>;
}
