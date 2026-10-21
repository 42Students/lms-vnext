import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohorts, programs, departments, sections, learnerProgramEnrollments,
  courseOfferings, cohortProgressionEvents, cohortProgressionState } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { collegeBatchRetireIdSchema, collegeBatchRetireSchema } from "./college-batch-retire-model";

export class CollegeBatchRetireError extends Error {
  constructor(public readonly code:"BATCH_NOT_FOUND"|"BATCH_STALE"|"BATCH_NOT_PLANNED"|"BATCH_HAS_DEPENDENCIES") {
    super(code);this.name="CollegeBatchRetireError";
  }
}
export async function retireCollegeBatch(context:RequestContext,rawId:unknown,raw:unknown) {
  const id=collegeBatchRetireIdSchema.parse(rawId),input=collegeBatchRetireSchema.parse(raw);
  // Both active College Admin and acting-college Super Admin use persisted,
  // tenant-scoped academic permissions, never an unscoped platform bypass.
  const member=await resolveActingCollege(context,"academics.manage");
  return getDb().transaction(async tx=>{
    const [batch]=await tx.select({id:cohorts.id,name:cohorts.name,status:cohorts.status})
      .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,member.collegeId)))
      .where(eq(cohorts.id,id)).for("update",{of:cohorts}).limit(1);
    if(!batch)throw new CollegeBatchRetireError("BATCH_NOT_FOUND");
    if(batch.status!=="PLANNED")throw new CollegeBatchRetireError("BATCH_NOT_PLANNED");
    const [current]=await tx.select({id:cohorts.id}).from(cohorts).where(and(
      eq(cohorts.id,id),sql`date_trunc('milliseconds',${cohorts.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
    )).limit(1);
    if(!current)throw new CollegeBatchRetireError("BATCH_STALE");
    const [[section],[learner],[offering],[history],[progression]] = await Promise.all([
      tx.select({id:sections.id}).from(sections).where(eq(sections.cohortId,id)).limit(1),
      tx.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments).where(eq(learnerProgramEnrollments.cohortId,id)).limit(1),
      tx.select({id:courseOfferings.id}).from(courseOfferings).where(eq(courseOfferings.cohortId,id)).limit(1),
      tx.select({id:cohortProgressionEvents.id}).from(cohortProgressionEvents).where(eq(cohortProgressionEvents.cohortId,id)).limit(1),
      tx.select({version:cohortProgressionState.version,currentTermNumber:cohortProgressionState.currentTermNumber})
        .from(cohortProgressionState).where(eq(cohortProgressionState.cohortId,id)).limit(1),
    ]);
    if(section||learner||offering||history||(progression&&(progression.version>0||progression.currentTermNumber>1)))
      throw new CollegeBatchRetireError("BATCH_HAS_DEPENDENCIES");
    const [updated]=await tx.update(cohorts).set({status:"ARCHIVED",updatedAt:new Date()})
      .where(and(eq(cohorts.id,id),eq(cohorts.status,"PLANNED"))).returning({id:cohorts.id,status:cohorts.status});
    if(!updated)throw new CollegeBatchRetireError("BATCH_STALE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_BATCH_UPDATED,
      collegeId:member.collegeId,organizationId:member.organizationId,
      subjectType:"cohort",subjectId:id,subjectLabel:batch.name,
      summary:"Unused planned batch archived",
      metadata:{fromStatus:"PLANNED",toStatus:"ARCHIVED"},
    });
    return updated;
  });
}
