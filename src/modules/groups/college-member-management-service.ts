import "server-only";

import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { lmsGroups } from "@/db/schema";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { collegeStudyMemberSchema } from "./college-member-management-model";
import {
  joinGroup, leaveGroup, setCollegeStudyMemberLock,
  removeAndLockCollegeStudyMember, GroupServiceError,
} from "./service";
import { collegeGroupIdSchema } from "./college-group-management-model";

/** The core service performs its own serialized group + actor checks again. */
export async function manageCollegeStudyMember(
  context: RequestContext, groupIdRaw: unknown, raw: unknown,
) {
  const groupId = collegeGroupIdSchema.parse(groupIdRaw);
  const input = collegeStudyMemberSchema.parse(raw);
  const scope = context.membership;
  if (!scope || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "academics.manage", {
        collegeId: scope.collegeId, organizationId: scope.organizationId,
      })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: scope.collegeId, organizationId: scope.organizationId,
  });
  const [group] = await getDb().select({ id: lmsGroups.id })
    .from(lmsGroups).where(and(
      eq(lmsGroups.id, groupId),
      eq(lmsGroups.collegeId, scope.collegeId),
      eq(lmsGroups.ownerScope, "COLLEGE"),
      eq(lmsGroups.kind, "STUDY_GROUP"),
      isNull(lmsGroups.deletedAt),
    )).limit(1);
  if (!group) throw new GroupServiceError("GROUP_NOT_MANAGEABLE");
  if (input.action === "ADD")
    return joinGroup(context, group.id, input.membershipId, "MANUAL", true);
  if (input.action === "REMOVE")
    return leaveGroup(context, group.id, input.membershipId, "MANUAL", true);
  if (input.action === "REMOVE_AND_LOCK")
    return removeAndLockCollegeStudyMember(context, group.id, input.membershipId, input.expectedVersion);
  return setCollegeStudyMemberLock(context, group.id, input.membershipId, input.locked);
}
