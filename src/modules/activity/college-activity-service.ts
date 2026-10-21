import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole,isSuperAdmin } from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { collegeActivityQuerySchema } from "./college-activity-model";
import { getActivityEventDetail, listActivityEvents, groupActivityEvents } from "./service";
import { z } from "zod";

async function requireCollegeActivity(context: RequestContext): Promise<string> {
  if(isSuperAdmin(context)){
    // A Super Admin must explicitly select one active college before viewing
    // its audit records; an organization-only or global read is not permitted.
    const acting=await resolveActingCollege(context,"activity.read");
    requirePermission(context,"activity.read",{
      collegeId:acting.collegeId,organizationId:acting.organizationId,
    });
    return acting.collegeId;
  }
  const member=context.membership;
  if(!member||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    !can(context,"activity.read",{collegeId:member.collegeId,organizationId:member.organizationId}))
    throw new AuthorizationError("activity.read");
  requirePermission(context,"activity.read",{collegeId:member.collegeId,organizationId:member.organizationId});
  return member.collegeId;
}

export async function listCollegeActivity(context: RequestContext, raw: unknown) {
  const query = collegeActivityQuerySchema.parse(raw);
  const collegeId=await requireCollegeActivity(context);
  const { pageSize, loaded, view, category, range: _range, ...filter } = query;
  const categories = {
    ACADEMIC_SETUP: "ACADEMICS",
    PEOPLE_ACCESS: "IDENTITY",
    TEACHING: "COURSES",
    PROJECTS: "PROJECTS",
  } as const;
  const activityModule = category ? categories[category] : filter.module;
  const first = await listActivityEvents(context, {
    ...filter, collegeId, module: activityModule,
    importantOnly: (view ?? "IMPORTANT") === "IMPORTANT" && !filter.importance,
    limit: Number(pageSize ?? "50"),
  });
  // Append bounded older pages to the same chronological feed, preserving
  // the selected college and permission checks for every page.
  const items = [...first.items];
  let nextCursor = first.nextCursor;
  let remainingCount = first.remainingCount;
  for (let batch=1; batch<(loaded ?? 1) && nextCursor; batch++) {
    const page = await listActivityEvents(context, {
      ...filter, collegeId, module: activityModule,
      importantOnly: (view ?? "IMPORTANT") === "IMPORTANT" && !filter.importance,
      beforeOccurredAt:nextCursor.beforeOccurredAt,beforeId:nextCursor.beforeId,
      limit:Number(pageSize ?? "50"),
    });
    items.push(...page.items);
    nextCursor=page.nextCursor;
    remainingCount=page.remainingCount;
  }
  return {items,groups:groupActivityEvents(items),nextCursor,remainingCount,query};
}

export async function getCollegeActivityDetail(context: RequestContext, rawId: unknown) {
  const id = z.string().uuid().parse(rawId);
  await requireCollegeActivity(context);
  return getActivityEventDetail(context, id);
}
