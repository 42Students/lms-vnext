import "server-only";
import {and,eq,isNull,sql,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,courseSectionDeliveries,departments,programs,
  sectionEnrollments,sectionFacultyAssignments,sectionScheduleEvents,sections} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {collegeSectionLifecycleSchema} from "./college-section-lifecycle-model";
export class CollegeSectionLifecycleError extends Error{
  constructor(public readonly code:"CLASS_NOT_FOUND"|"CLASS_STALE"|
    "CLASS_HAS_DEPENDENCIES"|"CLASS_HAS_LEARNERS"|"CLASS_HAS_SCHEDULE"|
    "CLASS_HAS_TEACHING"|"CLASS_HAS_DELIVERIES"|"CLASS_PARENT_UNAVAILABLE"|"CLASS_IDENTITY_CONFLICT"){
    super(code);this.name="CollegeSectionLifecycleError";
  }
}
export async function changeCollegeSectionLifecycle(context:RequestContext,rawId:unknown,raw:unknown){
  const id=z.string().uuid().parse(rawId),input=collegeSectionLifecycleSchema.parse(raw);
  const actor = await resolveActingCollege(context, "academics.manage");
  return getDb().transaction(async tx=>{
    const [section]=await tx.select({
      id:sections.id,name:sections.name,code:sections.code,status:sections.status,
      cohortId:sections.cohortId,periodId:sections.academicPeriodId,
      cohortStatus:cohorts.status,periodStatus:academicPeriods.status,
    }).from(sections)
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),
        eq(departments.collegeId,actor.collegeId)))
      .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
        eq(academicPeriods.collegeId,actor.collegeId)))
      .where(eq(sections.id,id)).for("update",{of:sections}).limit(1);
    if(!section)throw new CollegeSectionLifecycleError("CLASS_NOT_FOUND");
    const expectedStatus=input.action==="ARCHIVE"?"ACTIVE":"ARCHIVED";
    if(section.status!==expectedStatus)
      throw new CollegeSectionLifecycleError("CLASS_STALE");
    const [token]=await tx.select({id:sections.id}).from(sections).where(and(
      eq(sections.id,id),sql`date_trunc('milliseconds',${sections.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
    )).limit(1);
    if(!token)throw new CollegeSectionLifecycleError("CLASS_STALE");
    if(input.action==="ARCHIVE"){
      const [[enrolled],[faculty],[event],[delivery]]=await Promise.all([
        tx.select({id:sectionEnrollments.id}).from(sectionEnrollments)
          .where(eq(sectionEnrollments.sectionId,id)).limit(1),
        tx.select({id:sectionFacultyAssignments.id}).from(sectionFacultyAssignments)
          .where(eq(sectionFacultyAssignments.sectionId,id)).limit(1),
        tx.select({id:sectionScheduleEvents.id}).from(sectionScheduleEvents)
          .where(eq(sectionScheduleEvents.sectionId,id)).limit(1),
        tx.select({id:courseSectionDeliveries.id}).from(courseSectionDeliveries)
          .where(eq(courseSectionDeliveries.sectionId,id)).limit(1),
      ]);
      if(enrolled) throw new CollegeSectionLifecycleError("CLASS_HAS_LEARNERS");
      if(event) throw new CollegeSectionLifecycleError("CLASS_HAS_SCHEDULE");
      if(faculty) throw new CollegeSectionLifecycleError("CLASS_HAS_TEACHING");
      if(delivery) throw new CollegeSectionLifecycleError("CLASS_HAS_DELIVERIES");
    }else{
      if(!["PLANNED","ACTIVE"].includes(section.cohortStatus)||section.periodStatus==="CLOSED")
        throw new CollegeSectionLifecycleError("CLASS_PARENT_UNAVAILABLE");
      const [collision]=await tx.select({id:sections.id}).from(sections).where(and(
        eq(sections.cohortId,section.cohortId),eq(sections.academicPeriodId,section.periodId),
        eq(sections.status,"ACTIVE"),or(sql`lower(${sections.name})=lower(${section.name})`,
          sql`lower(${sections.code})=lower(${section.code})`))).limit(1);
      if(collision)throw new CollegeSectionLifecycleError("CLASS_IDENTITY_CONFLICT");
    }
    const [updated]=await tx.update(sections).set({
      status:input.action==="ARCHIVE"?"ARCHIVED":"ACTIVE",
      updatedAt:sql<Date>`greatest(${sections.updatedAt}+interval '1 millisecond',clock_timestamp())`,
    }).where(and(eq(sections.id,id),eq(sections.status,expectedStatus)))
      .returning({id:sections.id,status:sections.status,updatedAt:sections.updatedAt});
    if(!updated)throw new CollegeSectionLifecycleError("CLASS_STALE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED,
      collegeId:actor.collegeId,organizationId:actor.organizationId,
      subjectType:"section",subjectId:id,subjectLabel:section.name,
      summary:input.action==="ARCHIVE"?
        (isSuperAdmin(context)?"Super Admin archived class":"College Admin archived class"):
        (isSuperAdmin(context)?"Super Admin restored class":"College Admin restored class"),
      metadata:{before:expectedStatus,after:updated.status},
    });
    return updated;
  });
}

/** Legacy Delete is permitted only for a dependency-free class in the selected college.
 * Keep the optimistic token and audit event in the same transaction.
 */
export async function deleteCollegeSection(context: RequestContext, rawId: unknown, raw: unknown) {
  const id = z.string().uuid().parse(rawId);
  const input = z.object({
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    confirm: z.literal(true),
  }).strict().parse(raw);
  const actor = await resolveActingCollege(context, "academics.manage");
  return getDb().transaction(async tx => {
    const [section] = await tx.select({
      id: sections.id, name: sections.name,
    }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, actor.collegeId),
      ))
      .where(and(
        eq(sections.id, id),
        sql`date_trunc('milliseconds',${sections.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
      )).for("update", { of: sections }).limit(1);
    if (!section) throw new CollegeSectionLifecycleError("CLASS_STALE");

    const [[enrolled], [faculty], [event], [delivery]] = await Promise.all([
      tx.select({ id: sectionEnrollments.id }).from(sectionEnrollments)
        .where(eq(sectionEnrollments.sectionId, id)).limit(1),
      tx.select({ id: sectionFacultyAssignments.id }).from(sectionFacultyAssignments)
        .where(eq(sectionFacultyAssignments.sectionId, id)).limit(1),
      tx.select({ id: sectionScheduleEvents.id }).from(sectionScheduleEvents)
        .where(eq(sectionScheduleEvents.sectionId, id)).limit(1),
      tx.select({ id: courseSectionDeliveries.id }).from(courseSectionDeliveries)
        .where(eq(courseSectionDeliveries.sectionId, id)).limit(1),
    ]);
    if (enrolled) throw new CollegeSectionLifecycleError("CLASS_HAS_LEARNERS");
    if (faculty) throw new CollegeSectionLifecycleError("CLASS_HAS_TEACHING");
    if (event) throw new CollegeSectionLifecycleError("CLASS_HAS_SCHEDULE");
    if (delivery) throw new CollegeSectionLifecycleError("CLASS_HAS_DELIVERIES");

    const [deleted] = await tx.delete(sections)
      .where(eq(sections.id, id)).returning({ id: sections.id });
    if (!deleted) throw new CollegeSectionLifecycleError("CLASS_STALE");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED,
      collegeId: actor.collegeId, organizationId: actor.organizationId,
      subjectType: "section", subjectId: id, subjectLabel: section.name,
      summary: isSuperAdmin(context) ? "Super Admin deleted class" : "College Admin deleted class",
      metadata: { deleted: true, guarded: true },
    });
    return { id: deleted.id, name: section.name };
  });
}
