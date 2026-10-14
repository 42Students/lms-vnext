import "server-only";

import { count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementApplications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can, AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  buildLearnerPreparationChecklist, learnerPreparationQuerySchema,
} from "./learner-preparation-model";

/** Own-membership data only, backed by registered current enrollment/profile/application tables. */
export async function getOwnLearnerPlacementPreparation(
  context:RequestContext, rawQuery:unknown,
) {
  const query=learnerPreparationQuerySchema.parse(rawQuery);
  const member=await requireLearnerPlacementAccess(context);
  if (!can(context,"placements.read",{
    collegeId:member.collegeId,organizationId:member.organizationId,
  })) throw new AuthorizationError("placements.read");

  const [academic,self,applications]=await Promise.all([
    getOwnLearnerAcademicSummary(context),
    getOwnLearnerProfileWithRuntime(context),
    getDb().select({total:count()}).from(placementApplications)
      .where(eq(placementApplications.membershipId,member.id)),
  ]);
  if (self.person.membership.id!==member.id ||
      self.person.user.id!==context.user.id) {
    throw new AuthorizationError("placements.read");
  }

  const document=self.profile.profileDocument;
  const hasContact=Boolean(
    self.person.user.email?.trim() ||
    self.person.user.phoneE164?.trim() ||
    Object.values(document.contacts).some(value=>
      typeof value==="string" && value.trim().length>0),
  );
  return buildLearnerPreparationChecklist({
    hasEnrollment:academic.enrollment!==null,
    hasContact,
    hasSkills:document.skills.length>0,
    applicationCount:Number(applications[0]?.total??0),
  },query);
}
