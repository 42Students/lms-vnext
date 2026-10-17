import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {planFacultyScheduleReassignment,superAdminFacultyScheduleReassignSchema}
  from "@/modules/admin-ui/super-admin-faculty-schedule-reassign-model";
const src=(p:string)=>readFileSync(p,"utf8");
const at=(n:number)=>new Date(Date.UTC(2026,9,18,n,0,0));
const id=(suffix:string)=>"00000000-0000-4000-a000-"+suffix.padStart(12,"0");

describe("SA-academics-people-85 Super Admin faculty schedule reassignment",()=>{
 it("SA-academics-people-85 transfers non-overlapping future sessions while skipping collisions and overlapping proposed moves",()=>{
  const source=[
    {id:"z",startsAt:at(11),endsAt:at(12)},
    {id:"a",startsAt:at(10),endsAt:at(11)},
    {id:"b",startsAt:at(10),endsAt:at(11)},
    {id:"c",startsAt:at(13),endsAt:at(14)},
  ];
  const target=[{id:"existing",startsAt:at(11),endsAt:at(12)}];
  const plan=planFacultyScheduleReassignment(source,target);
  expect(plan.movable.map(e=>e.id)).toEqual(["a","c"]);
  expect(plan.skipped).toEqual(["b","z"]);
  expect(planFacultyScheduleReassignment(source,[]).movable.map(e=>e.id)).toEqual(["a","z","c"]);
 });
 it("SA-academics-people-85 rejects no-op account changes and requires explicit confirmation",()=>{
  const from=id("1"),to=id("2");
  expect(superAdminFacultyScheduleReassignSchema.safeParse({
    sourceMembershipId:from,replacementMembershipId:from,confirmed:true,
  }).success).toBe(false);
  expect(superAdminFacultyScheduleReassignSchema.safeParse({
    sourceMembershipId:from,replacementMembershipId:to,
  }).success).toBe(false);
  expect(superAdminFacultyScheduleReassignSchema.safeParse({
    sourceMembershipId:from,replacementMembershipId:to,confirmed:true,
  }).success).toBe(true);
 });
 it("SA-academics-people-85 scopes timetable updates to the selected active college with serializable locks and audit",()=>{
  const service=src("src/modules/admin-ui/super-admin-faculty-schedule-reassign-service.ts");
  expect(service).toContain('resolveActingCollege(context,"academics.manage")');
  expect(service).toContain('eq(departments.collegeId,selected.collegeId)');
  expect(service).toContain('eq(collegeMemberships.collegeId,selected.collegeId)');
  expect(service).toContain('eq(sectionScheduleEvents.status,"SCHEDULED")');
  expect(service).toContain("gt(sectionScheduleEvents.endsAt,now)");
  expect(service).toContain('for("update",{of:sectionScheduleEvents})');
  expect(service).toContain('isolationLevel:"serializable"');
  expect(service).toContain("recordActivityEventInTransaction");
  expect(src("src/app/api/admin/faculty/schedules/reassign/route.ts")).toContain("isSameOriginRequest(request)");
  expect(src("src/app/(authenticated)/admin/faculty/page.tsx")).toContain("SuperAdminFacultyScheduleReassignAction");
  const client=src("src/components/admin/super-admin-faculty-schedule-reassign-action.tsx");
  expect(client).toContain("Reassign class schedules");
  expect(client).toContain("Reassigned {report.reassigned} of {report.total} upcoming session(s).");
  expect(client).toContain("<ConfirmDialog");
 });
});
