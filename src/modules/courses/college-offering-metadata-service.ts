import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,courseOfferings,courseSectionDeliveries,
  courses,departments,programs} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {collegeOfferingMetadataSchema,offeringMetadataChangeAffectsDelivery}
  from "./college-offering-metadata-model";
export class CollegeOfferingMetadataError extends Error{
  constructor(public readonly code:"OFFERING_NOT_FOUND"|"OFFERING_STALE"|
    "OFFERING_PARENT_UNAVAILABLE"|"OFFERING_HAS_ACTIVE_DELIVERIES"){
    super(code);this.name="CollegeOfferingMetadataError";
  }
}
export async function updateCollegeOfferingMetadata(context:RequestContext,rawId:unknown,raw:unknown){
  const id=z.string().uuid().parse(rawId),input=collegeOfferingMetadataSchema.parse(raw);
  const member=context.membership;
  if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    !can(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
    throw new AuthorizationError("courses.manage");
  requirePermission(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  return getDb().transaction(async tx=>{
    const [offering]=await tx.select({
      id:courseOfferings.id,status:courseOfferings.status,type:courseOfferings.type,
      credits:courseOfferings.credits,displayOrder:courseOfferings.displayOrder,
      cohortId:courseOfferings.cohortId,periodId:courseOfferings.academicPeriodId,
    }).from(courseOfferings)
      .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
      .innerJoin(departments,and(eq(departments.id,courses.departmentId),
        eq(departments.collegeId,member.collegeId),isNull(departments.archivedAt)))
      .where(and(eq(courseOfferings.id,id),eq(courses.status,"ACTIVE")))
      .for("update",{of:courseOfferings}).limit(1);
    if(!offering)throw new CollegeOfferingMetadataError("OFFERING_NOT_FOUND");
    if(offering.status!=="ACTIVE")throw new CollegeOfferingMetadataError("OFFERING_PARENT_UNAVAILABLE");
    const [version]=await tx.select({id:courseOfferings.id}).from(courseOfferings).where(and(
      eq(courseOfferings.id,id),
      sql`date_trunc('milliseconds',${courseOfferings.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
    )).limit(1);
    if(!version)throw new CollegeOfferingMetadataError("OFFERING_STALE");
    const [cohort]=await tx.select({status:cohorts.status}).from(cohorts)
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),
        eq(departments.collegeId,member.collegeId)))
      .where(eq(cohorts.id,offering.cohortId)).for("share",{of:cohorts}).limit(1);
    const [period]=await tx.select({status:academicPeriods.status})
      .from(academicPeriods).where(and(eq(academicPeriods.id,offering.periodId),
        eq(academicPeriods.collegeId,member.collegeId))).for("share").limit(1);
    if(!cohort||!period||!["PLANNED","ACTIVE"].includes(cohort.status)||period.status==="CLOSED")
      throw new CollegeOfferingMetadataError("OFFERING_PARENT_UNAVAILABLE");
    if(offeringMetadataChangeAffectsDelivery(offering,input)){
      const [dependent]=await tx.select({id:courseSectionDeliveries.id})
        .from(courseSectionDeliveries).where(and(eq(courseSectionDeliveries.offeringId,id),
          isNull(courseSectionDeliveries.endedAt))).limit(1);
      if(dependent)throw new CollegeOfferingMetadataError("OFFERING_HAS_ACTIVE_DELIVERIES");
    }
    const [updated]=await tx.update(courseOfferings).set({
      type:input.type,credits:input.credits,displayOrder:input.displayOrder,
      // An elective cannot retain the CORE curriculum-row foreign key.
      // Keep the type and referenced-row transition atomic under DB02.
      ...(input.type==="ELECTIVE"?{programTermCourseId:null}:{}),
      updatedAt:sql<Date>`greatest(${courseOfferings.updatedAt} + interval '1 millisecond',clock_timestamp())`,
    }).where(eq(courseOfferings.id,id))
      .returning({id:courseOfferings.id,type:courseOfferings.type,credits:courseOfferings.credits,
        displayOrder:courseOfferings.displayOrder,updatedAt:courseOfferings.updatedAt});
    if(!updated)throw new CollegeOfferingMetadataError("OFFERING_STALE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.COURSES_OFFERING_UPDATED,
      collegeId:member.collegeId,organizationId:member.organizationId,
      subjectType:"course_offering",subjectId:id,
      summary:"College Admin updated course offering metadata",
      metadata:{before:{type:offering.type,credits:offering.credits,displayOrder:offering.displayOrder},
        after:{type:updated.type,credits:updated.credits,displayOrder:updated.displayOrder}},
    });
    return updated;
  });
}
