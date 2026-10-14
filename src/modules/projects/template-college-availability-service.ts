import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listColleges } from "@/modules/colleges/service";
import { getSuperAdminTemplateSubview } from "./template-subview-service";
import { projectTemplateCollegeAvailability, templateCollegeAvailabilityQuerySchema, templateAvailabilityCollegesInScope } from "./template-college-availability-model";
export async function listSuperAdminTemplateCollegeAvailability(context: RequestContext, templateId: string, rawQuery: unknown) {
  requirePermission(context, "project-template.read");
  const query = templateCollegeAvailabilityQuerySchema.parse(rawQuery);
  const [detail, colleges] = await Promise.all([
    getSuperAdminTemplateSubview(context, templateId, true), listColleges(context),
  ]);
  // Both sources are centrally authorized and scope-filtered. Never infer availability on a failed read.
  return { template: detail.template, ...projectTemplateCollegeAvailability(templateAvailabilityCollegesInScope(colleges, context.adminScope ?? null), detail.assignedColleges, query) };
}
