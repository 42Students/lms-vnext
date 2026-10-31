import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({
 course:vi.fn(),roster:vi.fn(),queries:[] as string[],
 sessionRows:[] as Array<Record<string,unknown>>,
 recordRows:[] as Array<Record<string,unknown>>,
 conditions:[] as Array<{table:string;sql:string;params:unknown[]}>,
}));
vi.mock("@/modules/courses/faculty-course-service",()=>({
 listFacultyCourseDeliveries:state.course,
}));
vi.mock("@/modules/courses/delivery-roster",()=>({
 listActiveDeliveryLearners:state.roster,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:(projection:Record<string,unknown>)=>{
   const dialect=new PgDialect();
   const table="eligibilityThresholdPercent" in projection?"policy":
    "facultyMembershipId" in projection?"sessions":"records";
   state.queries.push(table);
   class Query {
    from(){return this;}
    innerJoin(){return this;}
    leftJoin(){return this;}
    where(condition:SQL){
     const compiled=dialect.sqlToQuery(condition);
     state.conditions.push({table,sql:compiled.sql,params:compiled.params});
     return this;
    }
    async orderBy(){return table==="sessions"?state.sessionRows:state.recordRows;}
    async limit(){return [];}
   }
   return new Query();
  },
 }),
}));
import {getFacultyAttendanceWorkspace} from "@/modules/attendance/faculty-service";

const deliveryId="11111111-1111-4111-8111-111111111111";
const sectionId="22222222-2222-4222-8222-222222222222";
const periodId="33333333-3333-4333-8333-333333333333";
const ownId="44444444-4444-4444-8444-444444444444";
const otherId="55555555-5555-4555-8555-555555555555";
const collegeId="66666666-6666-4666-8666-666666666666";
const eventId="77777777-7777-4777-8777-777777777777";
function actor():RequestContext {
 return {
  user:{id:"faculty-user",identityUid:"faculty-identity",
   platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"faculty-membership",organizationId:"org",collegeId,
   status:"ACTIVE",roles:["FACULTY"]},
 };
}
beforeEach(()=>{
 vi.resetAllMocks();
 state.queries=[];
 state.conditions=[];
 state.course.mockResolvedValue([{deliveryId,sectionId,academicPeriodId:periodId}]);
 state.roster.mockResolvedValue([{membershipId:ownId,displayName:"Student A"}]);
 state.sessionRows=[{id:eventId,facultyMembershipId:"faculty-membership",
  title:"Lesson",startsAt:new Date("2099-04-02T10:00:00Z"),
  endsAt:new Date("2099-04-02T11:00:00Z"),attendanceStatus:"MARKED"}];
 state.recordRows=[{id:"attendance-1",scheduleEventId:eventId,
  membershipId:ownId,status:"ABSENT",note:null,
  email:"permitted-member@example.invalid"}];
});

describe("FAC-attendance-grades-18 / FAC-WORKSPACE-TENANT-01",()=>{
 it("restricts attendance records to current enrolled roster, active membership, active user and college",async()=>{
  const result=await getFacultyAttendanceWorkspace(actor(),deliveryId);
  expect(result.records).toHaveLength(1);
  expect(result.records[0]?.membershipId).toBe(ownId);
  expect(state.queries).toEqual(["policy","sessions","records"]);
  expect(state.roster).toHaveBeenCalledWith({deliveryId,sectionId,academicPeriodId:periodId,collegeId},expect.objectContaining({select:expect.any(Function)}));
  const recordWhere=state.conditions.find(c=>c.table==="records");
  expect(recordWhere).toBeDefined();
  expect(recordWhere?.sql).toContain('"attendance_records"."membership_id"');
  expect(recordWhere?.sql).toContain('"college_memberships"."college_id"');
  expect(recordWhere?.sql).toContain('"college_memberships"."status"');
  expect(recordWhere?.sql).toContain('"users"."platform_status"');
  expect(recordWhere?.params).toContain(ownId);
  expect(recordWhere?.params).toContain(collegeId);
  expect(recordWhere?.params).toContain("ACTIVE");
  expect(recordWhere?.params).not.toContain(otherId);
 });
 it("returns no historical contact records when the verified current roster is empty",async()=>{
  state.roster.mockResolvedValue([]);
  const result=await getFacultyAttendanceWorkspace(actor(),deliveryId);
  expect(result.roster).toEqual([]);
  expect(result.records).toEqual([]);
  expect(state.queries).toEqual(["policy","sessions"]);
 });
 it("does not query an event or a roster for a revoked teaching assignment",async()=>{
  state.course.mockResolvedValue([]);
  await expect(getFacultyAttendanceWorkspace(actor(),deliveryId))
   .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state.roster).not.toHaveBeenCalled();
  expect(state.queries).toEqual([]);
 });
 it("rejects forged delivery identifier before loading assigned Faculty courses",async()=>{
  await expect(getFacultyAttendanceWorkspace(actor(),"not-uuid")).rejects.toThrow();
  expect(state.course).not.toHaveBeenCalled();
  expect(state.queries).toEqual([]);
 });
});
