import "server-only";

import { loadSectionScope } from "@/modules/academics/scope";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { sectionIdSchema } from "@/modules/academics/validation";
import type { RequestContext, AdminScope } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** Unknown and foreign-college section URLs have the same absent result. */
export function sectionVisibleInAdminScope(
  selected: AdminScope | null | undefined,
  actual: { collegeId: string; organizationId: string },
): boolean {
  return Boolean(selected?.collegeId === actual.collegeId &&
    (!selected?.organizationId || selected.organizationId === actual.organizationId));
}

export async function resolveSuperAdminSectionDetail(context: RequestContext, rawId: unknown) {
  requirePermission(context, "academics.read");
  const id = sectionIdSchema.safeParse(rawId);
  if (!id.success || !context.adminScope?.collegeId) return null;
  try {
    const section = await loadSectionScope(id.data);
    if (!sectionVisibleInAdminScope(context.adminScope, section)) return null;
    requirePermission(context, "academics.read", {
      collegeId: section.collegeId, organizationId: section.organizationId,
    });
    return section;
  } catch (error) {
    if (error instanceof AcademicsServiceError && error.code === "SECTION_NOT_FOUND") return null;
    throw error;
  }
}
