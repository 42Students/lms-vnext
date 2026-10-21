import {NextResponse} from "next/server";
import {and,eq,gt,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {getDb} from "@/db/client";
import {apiErrorResponse} from "@/lib/api-error";
import {
  collegeMemberships,courseTeachingAssignments,courseSectionDeliveries,courseOfferings,
  courses,departments,membershipRoles,users,sectionScheduleEvents,sectionScheduleEventCourses,
} from "@/db/schema";
import {hasMembershipRole} from "@/modules/identity/context";
import {can,requirePermission} from "@/modules/permissions/policy";
import {teachingAssignmentConflict} from "@/modules/courses/teaching-assignment-guard";
import {teachingScheduleConflict} from "@/modules/courses/college-teaching-reassign-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

export const runtime="nodejs";
type Params={params:Promise<{assignmentId:string}>};
const editSchema=z.object({
  expectedMembershipId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  membershipId:z.string().uuid(),
  deliveryId:z.string().uuid(),
  role:z.enum(["PRIMARY","CO_TEACHER","TA"]),
  isActive:z.boolean(),
  academicYear:z.string().regex(/^[0-9]{4}(?:-[0-9]{2,4})?$/).nullable(),
  semesterNumber:z.number().int().min(1).max(20).nullable(),
}).strict();

export async function PATCH(request:Request,{params}:Params){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext(),member=context.membership;
    if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
       !hasMembershipRole(context,"COLLEGE_ADMIN")||
       !can(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    requirePermission(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
    const {assignmentId}=await params;
    const parsed=editSchema.safeParse(await request.json().catch(()=>null));
    if(!z.string().uuid().safeParse(assignmentId).success||!parsed.success)
      return NextResponse.json({error:"INVALID_REQUEST",message:"Review the selected faculty, course, semester and year."},{status:400});
    const input=parsed.data,txResult=await getDb().transaction(async tx=>{
      const [actor]=await tx.select({accountStatus:users.platformStatus,membershipStatus:collegeMemberships.status})
        .from(collegeMemberships)
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"COLLEGE_ADMIN")))
        .where(and(eq(collegeMemberships.id,member.id),
          eq(collegeMemberships.userId,context.user.id),eq(collegeMemberships.collegeId,member.collegeId)))
        .for("share").limit(1);
      if(!actor||actor.accountStatus!=="ACTIVE"||actor.membershipStatus!=="ACTIVE")
        return {error:"FORBIDDEN",status:403};
      const [old]=await tx.select({
        id:courseTeachingAssignments.id,deliveryId:courseTeachingAssignments.deliveryId,
        membershipId:courseTeachingAssignments.membershipId,role:courseTeachingAssignments.role,
        updatedAt:courseTeachingAssignments.updatedAt,
      }).from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
        .innerJoin(departments,and(eq(departments.id,courses.departmentId),
          eq(departments.collegeId,member.collegeId)))
        .where(and(eq(courseTeachingAssignments.id,assignmentId),isNull(courseTeachingAssignments.endedAt)))
        .for("update",{of:courseTeachingAssignments}).limit(1);
      if(!old)return {error:"ASSIGNMENT_NOT_FOUND",status:404};
      const updatedToMs=new Date(old.updatedAt).toISOString();
      if(old.membershipId!==input.expectedMembershipId||
         updatedToMs.slice(0,23)!==input.expectedUpdatedAt.slice(0,23))
        return {error:"ASSIGNMENT_STALE",status:409};
      const now=new Date();
      if(!input.isActive){
        await tx.update(courseTeachingAssignments).set({
          endedAt:now,updatedAt:now,legacyAcademicYear:input.academicYear,
          legacySemesterNumber:input.semesterNumber,
        }).where(eq(courseTeachingAssignments.id,old.id));
        await recordActivityEventInTransaction(tx,context,{
          eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ENDED,
          collegeId:member.collegeId,organizationId:member.organizationId,
          subjectType:"course_teaching_assignment",subjectId:old.id,subjectLabel:old.role,
          summary:"College Admin ended Faculty teaching assignment",
          metadata:{deliveryId:old.deliveryId,membershipId:old.membershipId},
        });
        return {ok:true,ended:true,status:200};
      }
      const [target]=await tx.select({id:courseSectionDeliveries.id})
        .from(courseSectionDeliveries)
        .innerJoin(courseOfferings,and(eq(courseOfferings.id,courseSectionDeliveries.offeringId),
          eq(courseOfferings.status,"ACTIVE")))
        .innerJoin(courses,and(eq(courses.id,courseOfferings.courseId),eq(courses.status,"ACTIVE")))
        .innerJoin(departments,and(eq(departments.id,courses.departmentId),
          eq(departments.collegeId,member.collegeId)))
        .where(and(eq(courseSectionDeliveries.id,input.deliveryId),
          isNull(courseSectionDeliveries.endedAt)))
        .for("update",{of:courseSectionDeliveries}).limit(1);
      if(!target)return {error:"TARGET_DELIVERY_NOT_FOUND",status:404};
      const [faculty]=await tx.select({id:collegeMemberships.id})
        .from(collegeMemberships)
        .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
          eq(users.platformStatus,"ACTIVE")))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"FACULTY")))
        .where(and(eq(collegeMemberships.id,input.membershipId),
          eq(collegeMemberships.collegeId,member.collegeId),
          eq(collegeMemberships.status,"ACTIVE")))
        .for("share").limit(1);
      if(!faculty)return {error:"TARGET_FACULTY_NOT_FOUND",status:404};
      const live=await tx.select({id:courseTeachingAssignments.id,
        membershipId:courseTeachingAssignments.membershipId,role:courseTeachingAssignments.role})
        .from(courseTeachingAssignments).where(and(
          eq(courseTeachingAssignments.deliveryId,input.deliveryId),
          isNull(courseTeachingAssignments.endedAt)));
      const conflict=teachingAssignmentConflict({membershipId:faculty.id,role:input.role},
        live.filter(item=>item.id!==old.id));
      if(conflict)return {error:conflict,status:409};
      if(old.membershipId!==input.membershipId||old.deliveryId!==input.deliveryId){
        const future=await tx.select({startsAt:sectionScheduleEvents.startsAt,endsAt:sectionScheduleEvents.endsAt})
          .from(sectionScheduleEvents)
          .innerJoin(sectionScheduleEventCourses,
            eq(sectionScheduleEventCourses.scheduleEventId,sectionScheduleEvents.id))
          .where(and(eq(sectionScheduleEventCourses.deliveryId,target.id),
            eq(sectionScheduleEvents.status,"SCHEDULED"),gt(sectionScheduleEvents.endsAt,now)))
          .limit(2001);
        const busy=await tx.select({startsAt:sectionScheduleEvents.startsAt,endsAt:sectionScheduleEvents.endsAt})
          .from(sectionScheduleEvents)
          .where(and(eq(sectionScheduleEvents.facultyMembershipId,faculty.id),
            eq(sectionScheduleEvents.status,"SCHEDULED"),gt(sectionScheduleEvents.endsAt,now)))
          .limit(2001);
        if(future.length>2000||busy.length>2000)
          return {error:"FACULTY_SCHEDULE_TOO_LARGE",status:409};
        if(teachingScheduleConflict(future,busy))
          return {error:"FACULTY_SCHEDULE_CONFLICT",status:409};
      }
      const changed=old.deliveryId!==input.deliveryId||old.membershipId!==input.membershipId||
        old.role!==input.role;
      let changedId=old.id;
      if(changed){
        await tx.update(courseTeachingAssignments).set({endedAt:now,updatedAt:now})
          .where(eq(courseTeachingAssignments.id,old.id));
        const [added]=await tx.insert(courseTeachingAssignments).values({
          deliveryId:target.id,membershipId:faculty.id,role:input.role,
          legacyAcademicYear:input.academicYear,legacySemesterNumber:input.semesterNumber,
        }).returning({id:courseTeachingAssignments.id});
        if(!added)return {error:"COULD_NOT_EDIT_ASSIGNMENT",status:409};
        changedId=added.id;
      }else{
        await tx.update(courseTeachingAssignments).set({
          legacyAcademicYear:input.academicYear,legacySemesterNumber:input.semesterNumber,
          updatedAt:now,
        }).where(eq(courseTeachingAssignments.id,old.id));
      }
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
        collegeId:member.collegeId,organizationId:member.organizationId,
        subjectType:"course_teaching_assignment",subjectId:changedId,subjectLabel:input.role,
        summary:"College Admin edited Faculty teaching assignment",
        metadata:{previousAssignmentId:old.id,deliveryId:target.id,
          membershipId:faculty.id,role:input.role,academicYear:input.academicYear,
          semesterNumber:input.semesterNumber},
      });
      return {ok:true,assignmentId:changedId,ended:false,status:200};
    });
    if("error" in txResult)return NextResponse.json({error:txResult.error,message:txResult.error},
      {status:txResult.status,headers:{"cache-control":"private, no-store"}});
    return NextResponse.json(txResult,{headers:{"cache-control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
