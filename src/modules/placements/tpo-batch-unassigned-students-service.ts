import "server-only";
import { and, countDistinct, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts, programs, departments, learnerProgramEnrollments,
  collegeMemberships, users, membershipRoles, sectionEnrollments, sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";

/** Learners with an active program enrollment but no active section in the same cohort. */
export async function countTpoLearnersWithoutClass(context: RequestContext) {
  const collegeId=await requireTpoBatchActor(context);
  const [row]=await getDb().select({
    total:countDistinct(learnerProgramEnrollments.membershipId),
  }).from(learnerProgramEnrollments)
    .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,collegeId)))
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
      eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
    .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER")))
    .where(and(eq(learnerProgramEnrollments.status,"ACTIVE"),
      sql`not exists (
        select 1 from section_enrollments se
        join sections sc on sc.id = se.section_id
        where se.learner_enrollment_id = ${learnerProgramEnrollments.id}
          and se.status = 'ACTIVE' and sc.status = 'ACTIVE'
          and sc.cohort_id = ${learnerProgramEnrollments.cohortId}
      )`));
  return row?.total??0;
}
