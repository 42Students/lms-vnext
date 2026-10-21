import "server-only";
import {z} from "zod";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  collegeMemberships,courseSectionDeliveries,courseTeachingAssignments,
  membershipRoles,courseOfferings,courses,departments,colleges,organizations,sections,academicPeriods,
  cohorts,cohortProgressionState,programTerms,programTermCourses,programs,
} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {loadCourseMembership,loadCourseSectionDeliveryScope} from "./scope";
import {teachingAssignmentConflict} from "./teaching-assignment-guard";
import {CoursesServiceError,postgresConstraintName} from "./errors";
import {createCourseTeachingAssignmentsBatchInputSchema} from "./validation";
import {COURSE_TEACHING_ROLES} from "./constants";

/** Legacy ADMIN and administrative Faculty grants map to the explicit
 * courses.manage permission in their active college membership. A global
 * Super Admin must still choose a college before mutating its assignments. */
function requireTeachingAssignmentManager(context:RequestContext){
 if(isSuperAdmin(context))return requireSuperAdminSelectedCollege(context,"courses.manage");
 const member=context.membership;
 if(!member||member.status!=="ACTIVE")throw new AuthorizationError("courses.manage");
 requirePermission(context,"courses.manage",{
  collegeId:member.collegeId,organizationId:member.organizationId,
 });
 return {collegeId:member.collegeId,organizationId:member.organizationId};
}

/** SA-academics-people-101: selected courses share one class and period.
 * All teaching grants and their audit records commit or roll back together. */
export async function createCourseTeachingAssignmentsBatch(
 context:RequestContext,rawInput:unknown,
){
 // Fail closed before fetching the requested delivery IDs or faculty identity.
 const selected=requireTeachingAssignmentManager(context);
 const input=createCourseTeachingAssignmentsBatchInputSchema.parse(rawInput);
 const ids=[...input.deliveryIds].sort();
 const [deliveries,member]=await Promise.all([
  Promise.all(ids.map(id=>loadCourseSectionDeliveryScope(id))),
  loadCourseMembership(input.membershipId),
 ]);
 const first=deliveries[0];
 if(!first)throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
 if(first.collegeId!==selected.collegeId||
   (selected.organizationId&&first.organizationId!==selected.organizationId))
   throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
 if(!deliveries.every(delivery=>
   delivery.collegeId===first.collegeId&&
   delivery.organizationId===first.organizationId&&
   delivery.sectionId===first.sectionId&&
   delivery.cohortId===first.cohortId&&
   delivery.academicPeriodId===first.academicPeriodId
 ))throw new CoursesServiceError("OFFERING_COHORT_PERIOD_MISMATCH");
 if(member.status!=="ACTIVE")throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
 if(member.collegeId!==first.collegeId)throw new CoursesServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
 if(!member.roles.includes("FACULTY"))throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
 try{
  return await getDb().transaction(async tx=>{
   // Explicit row locks serialize overlapping writers, including same-member
   // requests with different roles that the per-role unique index permits.
   const lockedDeliveries=await tx.select({id:courseSectionDeliveries.id})
    .from(courseSectionDeliveries)
    .where(and(inArray(courseSectionDeliveries.id,ids),isNull(courseSectionDeliveries.endedAt)))
    .orderBy(courseSectionDeliveries.id).for("update");
   if(lockedDeliveries.length!==ids.length)
    throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
   // The session snapshot alone is insufficient: actor suspension or role
   // revocation in another tab must win before any assignment is persisted.
   await assertPersistedPlatformPermission(tx,context,"courses.manage",{
     collegeId:first.collegeId,organizationId:first.organizationId,
   });
   // Lock and recheck tenant/course ancestry while still in this transaction.
   const live=await tx.select({
    id:courseSectionDeliveries.id,
    sectionId:courseSectionDeliveries.sectionId,
    offeringId:courseSectionDeliveries.offeringId,
    collegeId:departments.collegeId,
    organizationId:colleges.organizationId,
    cohortId:courseOfferings.cohortId,
    academicPeriodId:courseOfferings.academicPeriodId,
   }).from(courseSectionDeliveries)
    .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
    .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
      eq(academicPeriods.collegeId,first.collegeId)))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(and(inArray(courseSectionDeliveries.id,ids),
      isNull(courseSectionDeliveries.endedAt),
      eq(departments.collegeId,first.collegeId),
      eq(colleges.organizationId,first.organizationId),
      eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"),
      eq(sections.status,"ACTIVE"),eq(courseOfferings.status,"ACTIVE"),
    )).orderBy(courseSectionDeliveries.id).for("share");
   if(live.length!==ids.length||!live.every(delivery=>
     delivery.sectionId===first.sectionId&&
     delivery.cohortId===first.cohortId&&
     delivery.academicPeriodId===first.academicPeriodId
   ))throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
   // Reauthorize the administrator from persisted active user and role rows.
   // Revoking their account while the request waits on locks cannot leave
   // an older request context authorized to issue new faculty assignments.
   await assertPersistedPlatformPermission(tx,context,"courses.manage",{
    collegeId:first.collegeId,organizationId:first.organizationId,
   });
   // Mutations also recheck the faculty's persisted actor grant.
   const [liveMember]=await tx.select({
    collegeId:collegeMemberships.collegeId,status:collegeMemberships.status,
   }).from(collegeMemberships)
    .where(eq(collegeMemberships.id,input.membershipId))
    .for("share").limit(1);
   if(!liveMember||liveMember.status!=="ACTIVE")throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
   if(liveMember.collegeId!==first.collegeId)throw new CoursesServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
   const [facultyRole]=await tx.select({id:membershipRoles.id}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,input.membershipId),eq(membershipRoles.role,"FACULTY")))
    .for("share").limit(1);
   if(!facultyRole)throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
   const existing=await tx.select({
    deliveryId:courseTeachingAssignments.deliveryId,
    membershipId:courseTeachingAssignments.membershipId,
    role:courseTeachingAssignments.role,
   }).from(courseTeachingAssignments).where(and(
    inArray(courseTeachingAssignments.deliveryId,ids),
    isNull(courseTeachingAssignments.endedAt),
   ));
   for(const id of ids){
    const conflict=teachingAssignmentConflict(
     {membershipId:input.membershipId,role:input.role},
     existing.filter(item=>item.deliveryId===id),
    );
    if(conflict)throw new CoursesServiceError(conflict);
   }
   const created=await tx.insert(courseTeachingAssignments).values(ids.map(deliveryId=>({
    deliveryId,membershipId:input.membershipId,role:input.role,
   }))).returning();
   if(created.length!==ids.length)throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
   for(const row of created){
    await recordActivityEventInTransaction(tx,context,{
     eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
     collegeId:first.collegeId,organizationId:first.organizationId,
     subjectType:"course_teaching_assignment",subjectId:row.id,
     subjectLabel:row.role,summary:"Faculty teaching assignment created",
     metadata:{after:{deliveryId:row.deliveryId,membershipId:row.membershipId,
       role:row.role,endedAt:null}},
    });
   }
   return created;
  });
 }catch(error){
  if(error instanceof CoursesServiceError)throw error;
  const constraint=postgresConstraintName(error);
  if(constraint==="course_teaching_assignments_active_uq")
   throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
  if(constraint==="course_teaching_assignments_active_primary_uq")
   throw new CoursesServiceError("PRIMARY_TEACHER_CONFLICT");
  throw error;
 }
}

/** The legacy selection can span faculty, classes and academic periods.
 * Preserve the scoped atomic command per class, but report independent
 * successes/failures rather than rolling back unrelated classes. */
export async function createPartitionedCourseTeachingAssignments(
 context:RequestContext,rawInput:unknown,
){
 const batches=z.array(z.strictObject({
  deliveryIds:z.array(z.string().uuid()).min(1).max(100),
  membershipId:z.string().uuid(),role:z.enum(COURSE_TEACHING_ROLES),
 })).min(1).max(50).parse(rawInput);
 const selected=requireTeachingAssignmentManager(context);
 const succeeded:Array<{membershipId:string;deliveryIds:string[];createdIds:string[]}>=[];
 const failed:Array<{membershipId:string;deliveryIds:string[];reason:string}>=[];
 for(const batch of batches){
  const groups=new Map<string,string[]>();
  for(const id of new Set(batch.deliveryIds)){
   try{
    const scope=await loadCourseSectionDeliveryScope(id);
    if(scope.collegeId!==selected.collegeId||
       (selected.organizationId&&scope.organizationId!==selected.organizationId))
      throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
    const key=[scope.organizationId,scope.collegeId,scope.sectionId,
      scope.cohortId,scope.academicPeriodId].join(":");
    const ids=groups.get(key)??[];
    ids.push(id);groups.set(key,ids);
   }catch(error){
    failed.push({membershipId:batch.membershipId,deliveryIds:[id],
     reason:error instanceof CoursesServiceError?error.code:"SECTION_DELIVERY_NOT_FOUND"});
   }
  }
  for(const ids of groups.values()){
   for(let offset=0;offset<ids.length;offset+=10){
    const subset=ids.slice(offset,offset+10);
    try{
     const created=await createCourseTeachingAssignmentsBatch(context,{
      membershipId:batch.membershipId,role:batch.role,deliveryIds:subset,
     });
     succeeded.push({membershipId:batch.membershipId,
      deliveryIds:subset,createdIds:created.map(row=>row.id)});
    }catch(error){
     failed.push({membershipId:batch.membershipId,deliveryIds:subset,
      reason:error instanceof CoursesServiceError?error.code:"BATCH_ASSIGNMENT_FAILED"});
    }
   }
  }
 }
 return {succeeded,failed,partial:failed.length>0,createdCount:succeeded.reduce(
  (total,batch)=>total+batch.createdIds.length,0)};
}

/**
 * Companion to college-batch-promotion-execute's transaction-bound closure.
 * That workflow ends old-only faculty assignments, retains shared courses,
 * increments the cohort version and records endedTeachingAssignments in its
 * immutable batch-promotion audit. A rollback of cohort progression must run
 * FIRST, using the authorized promotion reversal workflow. This command only
 * restores specifically selected teaching grants after their cohort is back
 * in the old term; it NEVER rolls back academic progression itself.
 *
 * No unverified historical faculty links may be restored into another tenant
 * or a program term that no longer contains the mapped course. All-or-nothing,
 * row-locked and audit-recorded for the selected set.
 */
export async function restorePromotionEndedTeachingAssignments(
 context:RequestContext,raw:unknown,
){
 const selected=requireTeachingAssignmentManager(context);
 const input=z.strictObject({
  cohortId:z.uuid(),
  restoredTermNumber:z.number().int().min(1).max(30),
  assignmentIds:z.array(z.uuid()).min(1).max(100),
  reason:z.string().trim().min(10).max(900),
  confirm:z.literal(true),
 }).parse(raw);
 if(new Set(input.assignmentIds).size!==input.assignmentIds.length)
  throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
 const ids=[...input.assignmentIds].sort();
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"courses.manage",{
   collegeId:selected.collegeId,organizationId:selected.organizationId,
  });
  const [progress]=await tx.select({
   programId:cohorts.programId,
   currentTermNumber:cohortProgressionState.currentTermNumber,
   organizationId:colleges.organizationId,
  }).from(cohortProgressionState)
   .innerJoin(cohorts,eq(cohorts.id,cohortProgressionState.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .innerJoin(colleges,eq(colleges.id,departments.collegeId))
   .where(and(eq(cohortProgressionState.cohortId,input.cohortId),
    eq(departments.collegeId,selected.collegeId)))
   .for("update",{of:cohortProgressionState}).limit(1);
  if(!progress||progress.currentTermNumber!==input.restoredTermNumber||
     (selected.organizationId&&progress.organizationId!==selected.organizationId))
   throw new CoursesServiceError("OFFERING_COHORT_PERIOD_MISMATCH");
  const mapped=await tx.select({courseId:programTermCourses.courseId})
   .from(programTermCourses)
   .innerJoin(programTerms,eq(programTerms.id,programTermCourses.programTermId))
   .where(and(eq(programTerms.programId,progress.programId),
    eq(programTerms.termNumber,input.restoredTermNumber)));
  const mappedIds=new Set(mapped.map(row=>row.courseId));
  const ended=await tx.select({
   id:courseTeachingAssignments.id,
   deliveryId:courseTeachingAssignments.deliveryId,
   membershipId:courseTeachingAssignments.membershipId,
   role:courseTeachingAssignments.role,
   endedAt:courseTeachingAssignments.endedAt,
   courseId:courseOfferings.courseId,
   cohortId:courseOfferings.cohortId,
   deliveryEndedAt:courseSectionDeliveries.endedAt,
   offeringStatus:courseOfferings.status,
   facultyStatus:collegeMemberships.status,
   facultyCollegeId:collegeMemberships.collegeId,
  }).from(courseTeachingAssignments)
   .innerJoin(courseSectionDeliveries,
    eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(collegeMemberships,
    eq(collegeMemberships.id,courseTeachingAssignments.membershipId))
   .where(inArray(courseTeachingAssignments.id,ids))
   .orderBy(courseTeachingAssignments.id)
   .for("update",{of:courseTeachingAssignments});
  if(ended.length!==ids.length||ended.some(row=>
   row.endedAt===null||row.cohortId!==input.cohortId||
   row.deliveryEndedAt!==null||row.offeringStatus!=="ACTIVE"||
   row.facultyStatus!=="ACTIVE"||row.facultyCollegeId!==selected.collegeId||
   !mappedIds.has(row.courseId)))
   throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
  const facultyIds=[...new Set(ended.map(row=>row.membershipId))];
  const roles=await tx.select({membershipId:membershipRoles.membershipId})
   .from(membershipRoles).where(and(
    inArray(membershipRoles.membershipId,facultyIds),
    eq(membershipRoles.role,"FACULTY"),
   ));
  if(new Set(roles.map(row=>row.membershipId)).size!==facultyIds.length)
   throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
  const deliveryIds=[...new Set(ended.map(row=>row.deliveryId))];
  const active=await tx.select({
   deliveryId:courseTeachingAssignments.deliveryId,
   membershipId:courseTeachingAssignments.membershipId,
   role:courseTeachingAssignments.role,
  }).from(courseTeachingAssignments).where(and(
   inArray(courseTeachingAssignments.deliveryId,deliveryIds),
   isNull(courseTeachingAssignments.endedAt),
  )).for("update");
  for(const row of ended){
   if(teachingAssignmentConflict({membershipId:row.membershipId,role:row.role},
    active.filter(item=>item.deliveryId===row.deliveryId)))
    throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
  }
  const updatedAt=new Date();
  const restored=[];
  for(const row of ended){
   const [saved]=await tx.update(courseTeachingAssignments).set({
    endedAt:null,updatedAt,
   }).where(and(eq(courseTeachingAssignments.id,row.id),
    eq(courseTeachingAssignments.endedAt,row.endedAt!)))
    .returning({id:courseTeachingAssignments.id});
   if(!saved)throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
   restored.push(saved.id);
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
    collegeId:selected.collegeId,organizationId:progress.organizationId,
    subjectType:"course_teaching_assignment",subjectId:row.id,
    subjectLabel:row.role,summary:"Faculty teaching assignment restored after batch promotion reversal",
    metadata:{action:"RESTORE_AFTER_BATCH_PROMOTION",cohortId:input.cohortId,
     restoredTermNumber:input.restoredTermNumber,reason:input.reason,
     before:{endedAt:row.endedAt?.toISOString()},
     after:{endedAt:null},deliveryId:row.deliveryId,membershipId:row.membershipId},
   });
  }
  return {restoredAssignmentIds:restored,count:restored.length,
   cohortId:input.cohortId,restoredTermNumber:input.restoredTermNumber};
 });
}
