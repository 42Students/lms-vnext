import type { AdminScope } from "@/modules/identity/context";

/** Cross-college and inconsistent selected organization links never become readable. */
export function resourceVisibleInAdminScope(
  selected: AdminScope | null | undefined,
  actual: { collegeId: string; organizationId: string },
): boolean {
  return Boolean(selected?.collegeId === actual.collegeId &&
    (!selected?.organizationId || selected.organizationId === actual.organizationId));
}
