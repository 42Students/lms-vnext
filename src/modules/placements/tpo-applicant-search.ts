import { ilike, or, sql } from "drizzle-orm";
import {collegeMemberships,learnerProfiles,placementJobRoleOptions,users} from "@/db/schema";
import {tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";

/** TPO-drive-workspace-R02: shared tenant-bound search for live pipeline and CSV.
 * The correlated academic lookup preserves one row per application even when a
 * learner has historical cohort enrollments.
 */
export function tpoApplicantSearchCondition(search:string,collegeId:string){
 const pattern=tpoApplicantExportSearchPattern(search);
 return or(
  ilike(users.displayName,pattern),
  ilike(placementJobRoleOptions.title,pattern),
  ilike(learnerProfiles.rollNumber,pattern),
  ilike(learnerProfiles.registrationNumber,pattern),
  ilike(users.email,pattern),
  ilike(users.phoneE164,pattern),
  sql`exists (select 1 from learner_program_enrollments applicant_enrollment
   join cohorts applicant_cohort on applicant_cohort.id = applicant_enrollment.cohort_id
    and applicant_cohort.program_id = applicant_enrollment.program_id
   join programs applicant_program on applicant_program.id = applicant_enrollment.program_id
   join departments applicant_department on applicant_department.id = applicant_program.department_id
   where applicant_enrollment.membership_id = ${collegeMemberships.id}
    and applicant_department.college_id = ${collegeId}::uuid
    and (applicant_cohort.name ilike ${pattern}
      or applicant_department.name ilike ${pattern}))`,
 );
}
