import "server-only";
import { and, asc, count, countDistinct, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { departments, electiveSlots, electiveOfferings, lmsGroupMembers, collegeMemberships, programs,
  lmsGroups, courseSectionDeliveries, sections, courseTeachingAssignments, users } from "@/db/schema";
import { z } from "zod";
import { listElectiveOfferings } from "./service";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { adminElectiveQuerySchema, summarizeAdminElectives } from "./admin-directory-model";

/** A selected elective slot's entire read-only panel: offering capacity,
 * active enrolled roster and faculty (teaching assignment names) are resolved
 * through authoritative college-owned deliveries. Archived offerings remain
 * visible for audits, but don't contribute to the active seat counter.
 */
export async function getSuperAdminElectiveSlotDetail(context:RequestContext,rawSlotId:unknown){
  if(!isSuperAdmin(context))throw new AuthorizationError("academics.read");
  const collegeId=context.adminScope?.collegeId;
  if(!collegeId)throw new AuthorizationError("academics.read");
  requirePermission(context,"academics.read",{
    collegeId,organizationId:context.adminScope?.organizationId,
  });
  const slotId=z.uuid().parse(rawSlotId);
  const db=getDb();
  const [slot]=await db.select({
    id:electiveSlots.id,name:electiveSlots.name,description:electiveSlots.description,
    programId:electiveSlots.programId,programName:programs.name,
    semesterNumber:electiveSlots.semesterNumber,academicYear:electiveSlots.academicYear,
    minPick:electiveSlots.minPick,maxPick:electiveSlots.maxPick,
    credits:electiveSlots.credits,status:electiveSlots.status,
  }).from(electiveSlots)
    .innerJoin(programs,eq(programs.id,electiveSlots.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,collegeId)))
    .where(and(eq(electiveSlots.id,slotId),
      eq(electiveSlots.collegeId,collegeId),isNull(electiveSlots.deletedAt)))
    .limit(1);
  if(!slot)return null;
  const offerings=await listElectiveOfferings(context,slotId);
  const deliveryIds=offerings.map(item=>item.backedDeliveryId).filter(Boolean);
  const [faculty,sectionLabels]=await Promise.all([
    deliveryIds.length?db.select({
      deliveryId:courseTeachingAssignments.deliveryId,
      displayName:users.displayName,
    }).from(courseTeachingAssignments)
      .innerJoin(collegeMemberships,and(
        eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
        eq(collegeMemberships.collegeId,collegeId)))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(inArray(courseTeachingAssignments.deliveryId,deliveryIds),
        isNull(courseTeachingAssignments.endedAt),
        eq(collegeMemberships.status,"ACTIVE"))):[],
    deliveryIds.length?db.select({
      deliveryId:courseSectionDeliveries.id,sectionName:sections.name,
      legacyClassId:sections.legacyClassId,
    }).from(courseSectionDeliveries)
      .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
      .where(inArray(courseSectionDeliveries.id,deliveryIds)):[],
  ]);
  const facultyByDelivery=new Map<string,string[]>();
  for(const row of faculty){
    const list=facultyByDelivery.get(row.deliveryId)??[];
    if(row.displayName&&!list.includes(row.displayName))list.push(row.displayName);
    facultyByDelivery.set(row.deliveryId,list);
  }
  const sectionByDelivery=new Map(sectionLabels.map(row=>[row.deliveryId,row]));
  const enriched=offerings.map(row=>({
    ...row,facultyNames:facultyByDelivery.get(row.backedDeliveryId)??[],
    facultyCount:facultyByDelivery.get(row.backedDeliveryId)?.length??0,
    sectionName:sectionByDelivery.get(row.backedDeliveryId)?.sectionName??null,
    legacyClassId:sectionByDelivery.get(row.backedDeliveryId)?.legacyClassId??null,
  }));
  return {
    slot,offerings:enriched,
    roster:{
      activeSeatEnrollments:enriched.reduce((n,row)=>n+(row.status==="ACTIVE"?row.activeMembers:0),0),
      // A learner selected for two courses counts twice as a seat but once
      // in a slot student headcount. The list directory uses countDistinct.
      activeOfferings:enriched.filter(row=>row.status==="ACTIVE").length,
      waitlistedRequests:enriched.reduce((n,row)=>n+(row.status==="ACTIVE"?row.waitlistedCount:0),0),
      countSemantics:"ACTIVE_MEMBERSHIP_DISTINCT_FOR_STUDENTS; SUM_PER_OFFERING_FOR_SEATS",
    },
  };
}

/** Read-only scoped elective slots; no College Admin membership fallback. */
export async function listSuperAdminElectives(context: RequestContext, raw: unknown) {
  const query = adminElectiveQuerySchema.parse(raw);
  if (!isSuperAdmin(context)) throw new AuthorizationError("academics.read");
  const collegeId = context.adminScope?.collegeId ?? null;
  if (!collegeId) return { state: "CHOOSE_COLLEGE" as const, query,
    ...summarizeAdminElectives([]), truncated: false, totalPages:1, programs: [] as {id:string;name:string}[] };
  requirePermission(context, "academics.read", {
    organizationId: context.adminScope?.organizationId,
    collegeId,
  });
  const pattern = query.q ? "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%" : null;
  // Legacy includeArchived=true maps to status=ALL; an explicit archived
  // status is a historical-only listing. pageSize defaults to 20, not 200.
  const where=and(
    eq(electiveSlots.collegeId,collegeId),
    isNull(electiveSlots.deletedAt),
    query.status==="ALL"?undefined:eq(electiveSlots.status,query.status),
    query.programId?eq(electiveSlots.programId,query.programId):undefined,
    query.semesterNumber!==undefined?eq(electiveSlots.semesterNumber,query.semesterNumber):undefined,
    pattern?or(ilike(electiveSlots.name,pattern),ilike(programs.name,pattern),
      ilike(electiveSlots.description,pattern)):undefined,
  );
  const [matchCount]=await getDb().select({total:count()}).from(electiveSlots)
    .innerJoin(programs,eq(programs.id,electiveSlots.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,collegeId)))
    .where(where);
  const rows = await getDb().select({
    id: electiveSlots.id,
    name: electiveSlots.name,
    description: electiveSlots.description,
    version: electiveSlots.version,
    programId: programs.id,
    programName: programs.name,
    semesterNumber: electiveSlots.semesterNumber,
    academicYear: electiveSlots.academicYear,
    academicPeriodId:electiveSlots.academicPeriodId,
    hasEnrollmentHistory:sql<boolean>`exists (
      select 1 from elective_offerings eo where eo.slot_id = ${electiveSlots.id}
      and (exists (select 1 from lms_group_members gm where gm.group_id=eo.group_id)
        or exists (select 1 from lms_group_member_events ev where ev.group_id=eo.group_id))
    )`.as("elective_has_enrollment_history"),
    credits: electiveSlots.credits,
    minPick: electiveSlots.minPick,
    maxPick: electiveSlots.maxPick,
    status: electiveSlots.status,
  }).from(electiveSlots)
    .innerJoin(programs, eq(programs.id, electiveSlots.programId))
    .innerJoin(departments, and(eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId)))
    .where(where)
    .orderBy(asc(programs.name), asc(electiveSlots.semesterNumber), asc(electiveSlots.name), asc(electiveSlots.id))
    .limit(query.pageSize).offset((query.page-1)*query.pageSize);
  const shown=rows;
  const ids = shown.map(row => row.id);
  const [programChoices, offeringCounts, studentCounts] = await Promise.all([
    getDb().select({id:programs.id,name:programs.name}).from(programs)
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name)),
    ids.length ? getDb().select({slotId:electiveOfferings.slotId,total:count()})
      .from(electiveOfferings).where(and(inArray(electiveOfferings.slotId,ids),
        eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt)))
      .groupBy(electiveOfferings.slotId) : Promise.resolve([]),
    ids.length ? getDb().select({slotId:electiveOfferings.slotId,
        total:countDistinct(lmsGroupMembers.membershipId)})
      .from(electiveOfferings)
      .innerJoin(lmsGroupMembers,and(eq(lmsGroupMembers.groupId,electiveOfferings.groupId),
        eq(lmsGroupMembers.state,"ACTIVE"),eq(lmsGroupMembers.memberType,"LEARNER")))
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,lmsGroupMembers.membershipId),
        eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
      .where(and(inArray(electiveOfferings.slotId,ids),
        eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt)))
      .groupBy(electiveOfferings.slotId) : Promise.resolve([]),
  ]);
  const offerings = new Map(offeringCounts.map(item=>[item.slotId,item.total]));
  const students = new Map(studentCounts.map(item=>[item.slotId,item.total]));
  return { state: "READY" as const, query, programs:programChoices,
    ...summarizeAdminElectives(shown.map(row=>({...row,
      offerings:offerings.get(row.id)??0,students:students.get(row.id)??0}))),
    total:matchCount?.total??0,
    totalPages:Math.max(1,Math.ceil((matchCount?.total??0)/query.pageSize)),
    pageSize:query.pageSize,page:query.page,
    // Counts in summarizeAdminElectives are page-local. total/totalPages are
    // full SQL-filtered directory counts; avoid presenting page total as global.
    countsScope:"PAGE" as const,
    truncated:false };
}
