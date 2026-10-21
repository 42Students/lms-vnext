import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { collegeActivityQuerySchema } from "./college-activity-model";
import { getActivityEventDetail, listActivityEvents } from "./service";
import { z } from "zod";

function requireCollegeActivity(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "activity.read", {
      collegeId: member.collegeId,
      organizationId: member.organizationId,
    })) {
    throw new AuthorizationError("activity.read");
  }
  requirePermission(context, "activity.read", {
    collegeId: member.collegeId,
    organizationId: member.organizationId,
  });
}

export async function listCollegeActivity(context: RequestContext, raw: unknown) {
  const query = collegeActivityQuerySchema.parse(raw);
  requireCollegeActivity(context);
  const { pageSize, view, category, range: _range, ...filter } = query;
  const categories = {
    ACADEMIC_SETUP: "ACADEMICS",
    PEOPLE_ACCESS: "IDENTITY",
    TEACHING: "COURSES",
    PROJECTS: "PROJECTS",
  } as const;
  const activityModule = category ? categories[category] : filter.module;
  const result = await listActivityEvents(context, {
    ...filter, module: activityModule,
    importantOnly: (view ?? "IMPORTANT") === "IMPORTANT" && !filter.importance,
    limit: Number(pageSize ?? "25"),
  });
  return { ...result, query };
}

export async function getCollegeActivityDetail(context: RequestContext, rawId: unknown) {
  const id = z.string().uuid().parse(rawId);
  requireCollegeActivity(context);
  return getActivityEventDetail(context, id);
}
