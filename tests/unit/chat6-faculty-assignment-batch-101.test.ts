import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createCourseTeachingAssignmentsBatchInputSchema} from "@/modules/courses/validation";
const read=(file:string)=>readFileSync(file,"utf8");
const ids=["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"];
const membershipId="33333333-3333-4333-8333-333333333333";

describe("SA-academics-people-101 multi-course faculty assignment",()=>{
 it("accepts one to ten unique persisted course deliveries and rejects forged scope, duplicates and unbounded input",()=>{
  const valid={deliveryIds:ids,membershipId,role:"PRIMARY"};
  expect(createCourseTeachingAssignmentsBatchInputSchema.safeParse(valid).success).toBe(true);
  for(const invalid of [
   {...valid,deliveryIds:[]},
   {...valid,deliveryIds:[ids[0],ids[0]]},
   {...valid,deliveryIds:Array.from({length:11},(_,i)=>"00000000-0000-4000-8000-"+String(i).padStart(12,"0"))},
   {...valid,collegeId:ids[0]},
   {...valid,role:"ADMIN"},
   {...valid,membershipId:"foreign"},
  ])expect(createCourseTeachingAssignmentsBatchInputSchema.safeParse(invalid).success).toBe(false);
 });
 it("performs a single transaction, stable row locks, rechecks same class/semester/college and authorizes faculty again",()=>{
  const service=read("src/modules/courses/teaching-assignment-batch-service.ts");
  expect(service).toContain("createCourseTeachingAssignmentsBatchInputSchema.parse(rawInput)");
  expect(service).toContain('requireSuperAdminSelectedCollege(context,"courses.manage")');
  expect(service.indexOf("requireSuperAdminSelectedCollege(")).toBeLessThan(service.indexOf("loadCourseSectionDeliveryScope("));
  expect(service).toContain("delivery.sectionId===first.sectionId");
  expect(service).toContain("delivery.academicPeriodId===first.academicPeriodId");
  expect(service).toContain("delivery.organizationId===first.organizationId");
  expect(service).toContain("member.roles.includes(\"FACULTY\")");
  expect(service).toContain("const ids=[...input.deliveryIds].sort()");
  expect(service).toContain("return await getDb().transaction(async tx=>");
  expect(service).toContain('orderBy(courseSectionDeliveries.id).for("update")');
  expect(service).toContain("lockedDeliveries.length!==ids.length");
  expect(service).toContain('eq(colleges.status,"ACTIVE")');
  expect(service).toContain('eq(sections.status,"ACTIVE")');
  expect(service).toContain("eq(sections.cohortId,courseOfferings.cohortId)");
  expect(service).toContain("eq(sections.academicPeriodId,courseOfferings.academicPeriodId)");
  expect(service).toContain("liveMember.status!==\"ACTIVE\"");
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"courses.manage"');
  expect(service).toContain('eq(membershipRoles.role,"FACULTY")');
  expect(service).toContain("teachingAssignmentConflict(");
  expect(service).toContain(".insert(courseTeachingAssignments).values(ids.map(");
  expect(service).toContain("created.length!==ids.length");
  expect(service).toContain("for(const row of created)");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
  expect(service.indexOf("teachingAssignmentConflict(")).toBeLessThan(service.indexOf(".insert(courseTeachingAssignments)"));
  expect(service.indexOf(".insert(courseTeachingAssignments)")).toBeLessThan(service.indexOf("recordActivityEventInTransaction(tx,context"));
  expect(service).toContain("course_teaching_assignments_active_primary_uq");
 });
 it("shows legacy Course(s) multi-selection within one class and retains inputs after a failed save",()=>{
  const form=read("src/components/admin/super-admin-faculty-assignment-create.tsx");
  const page=read("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  expect(page).toContain("<SuperAdminFacultyAssignmentCreate");
  expect(form).toContain(">Course(s)</legend>");
  expect(form).toContain("Select up to 9 additional courses for the same class and semester.");
  expect(form).toContain("item.sectionId===selected.sectionId");
  expect(form).toContain("deliveryIds.length>10");
  expect(form).toContain('apiFetch("/api/admin/faculty-assignment/batch"');
  expect(form).toContain("body:JSON.stringify({deliveryIds,membershipId,role})");
  expect(form).toContain("useGuardedAction");
  expect(form).toContain('setNotice(deliveryIds.length===1?"Teaching assignment created."');
  expect(form).toContain("teaching assignments for this class.");
  expect(form).toContain('setOtherDeliveryIds([])');
  expect(form).toContain("Could not assign this faculty member.");
  expect(form.indexOf("setOtherDeliveryIds([]);setMembershipId")).toBeGreaterThan(form.indexOf("await apiFetch("));
 });
});
