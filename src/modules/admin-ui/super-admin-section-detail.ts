import "server-only";

import { loadSectionScope } from "@/modules/academics/scope";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { sectionIdSchema } from "@/modules/academics/validation";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { resourceVisibleInAdminScope } from "./super-admin-resource-scope-model";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

export async function resolveSuperAdminSectionDetail(context: RequestContext, rawId: unknown) {
  // Generic academics.read is also available to active Faculty and Learners
  // for their own college. A Super Admin route needs an explicit platform-role
  // gate even if a stale or forged context carries a selected adminScope.
  if (!isSuperAdmin(context)) throw new AuthorizationError("academics.read");
  requirePermission(context, "academics.read", {
    collegeId: context.adminScope?.collegeId ?? undefined,
    organizationId: context.adminScope?.organizationId ?? undefined,
  });
  const id = sectionIdSchema.safeParse(rawId);
  if (!id.success || !context.adminScope?.collegeId) return null;
  try {
    const section = await loadSectionScope(id.data);
    if (!resourceVisibleInAdminScope(context.adminScope, section)) return null;
    requirePermission(context, "academics.read", {
      collegeId: section.collegeId, organizationId: section.organizationId,
    });
    return section;
  } catch (error) {
    if (error instanceof AcademicsServiceError && error.code === "SECTION_NOT_FOUND") return null;
    throw error;
  }
}
