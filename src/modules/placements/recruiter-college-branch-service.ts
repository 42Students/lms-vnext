import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import { getRecruiterCollegeDemographics } from "./recruiter-college-demographics-service";
import { recruiterCollegeCardDetail } from "./recruiter-college-card-service";

/** The company may see only verified grant-scoped aggregate branches.
 * A department is not a learner branch unless it has an active enrollment;
 * names/groups with fewer than ten learners are suppressed by SQL, before
 * any result reaches this service. Sorting matches the old Colleges chooser.
 */
export async function listRecruiterCollegeBranches(context:RequestContext,collegeId:string) {
 const snapshot=await getRecruiterCollegeDemographics(context,collegeId);
 return snapshot.byBranch.map(item=>item.branch)
  .sort((a,b)=>a.localeCompare(b,"en-IN"));
}

/** Replacement for V1 RecruiterSelf college item: only an authorized college,
 * rounded learner counts and learner-derived branches. TPO contact is absent
 * rather than guessed where no active college placement lead exists. */
export async function getRecruiterCollegeBranchesSummary(
 context:RequestContext,collegeId:string,
) {
 const card=await recruiterCollegeCardDetail(context,collegeId);
 return {
  collegeId:card.collegeId,
  studentsTotal:card.studentCount,
  branches:card.branches??[],
  branchCounts:card.branchCounts??[],
  branchPlaceholder:card.branchCounts?.length?"":"No branches recorded",
  tpoContact:card.tpoContact,
  contactPlaceholder:card.tpoContact?"":"No TPO contact available",
  countPolicy:"ROUNDED_MIN_10" as const,
  errors:card.errors,
 };
}
