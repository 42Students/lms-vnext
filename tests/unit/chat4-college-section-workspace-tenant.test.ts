import {afterEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {getSectionOperationsWorkspace} from "@/modules/academics/section-workspace";

const mock=vi.hoisted(()=>{
 const scope=vi.fn();
 const enrollments=vi.fn();
 const roster=vi.fn();
 const faculty=vi.fn();
 const schedule=vi.fn();
 const courses=vi.fn();
 const select=vi.fn();
 const rows:Array<Array<Record<string,unknown>>>=[];
 const query={from(){return this;},innerJoin(){return this;},where(){return this;},
  orderBy(){return this;},limit(){return Promise.resolve(rows.shift()??[]);},
  // Drizzle's orderBy() is a thenable query, not a raw query builder.
  // Model the asynchronous execution when Promise.all resolves learner/faculty choices.
  then(resolve:(rows:Record<string,unknown>[])=>unknown,reject:(reason:unknown)=>unknown){
   return Promise.resolve(rows.shift()??[]).then(resolve,reject);
  }};
 return {scope,enrollments,roster,faculty,schedule,courses,select,rows,query};
});
vi.mock("@/modules/academics/scope",()=>({loadSectionScope:mock.scope}));
vi.mock("@/modules/academics/enrollment-service",()=>({listLearnerProgramEnrollments:mock.enrollments}));
vi.mock("@/modules/academics/roster-service",()=>({listSectionRoster:mock.roster}));
vi.mock("@/modules/academics/faculty-assignment-service",()=>({listSectionFacultyAssignments:mock.faculty}));
vi.mock("@/modules/academics/schedule-service",()=>({
 listSectionScheduleEvents:mock.schedule,listSectionScheduleCourseChoices:mock.courses,
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:(...args:unknown[])=>{mock.select(...args);return mock.query;}})}));

const college="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const section="33333333-3333-4333-8333-333333333333";
const program="44444444-4444-4444-8444-444444444444";
const cohort="55555555-5555-4555-8555-555555555555";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
afterEach(()=>{
 for(const fn of [mock.scope,mock.enrollments,mock.roster,mock.faculty,mock.schedule,mock.courses,mock.select])fn.mockReset();
 mock.rows.length=0;
});
describe("College Admin class operations workspace isolation and composite data",()=>{
 it("COL-classes-tenant-01 rejects cross-tenant scope and expired or disabled actor before any private roster read",async()=>{
  mock.scope.mockResolvedValue({id:section,collegeId:foreign,organizationId:org});
  await expect(getSectionOperationsWorkspace(actor,section)).rejects.toMatchObject({name:"AuthorizationError"});
  expect(mock.select).not.toHaveBeenCalled();
  mock.scope.mockResolvedValue({id:section,collegeId:college,organizationId:org});
  await expect(getSectionOperationsWorkspace({...actor,user:{...actor.user,platformStatus:"DISABLED"}},section))
   .rejects.toMatchObject({name:"AuthorizationError"});
  expect(mock.select).not.toHaveBeenCalled();
  await expect(getSectionOperationsWorkspace(actor,"forged-section-id")).rejects.toBeDefined();
 });
 it("COL-classes-tenant-05 an ordinary learner or faculty with academics.read cannot enumerate all class operations",async()=>{
  mock.scope.mockResolvedValue({id:section,collegeId:college,organizationId:org});
  for(const role of ["LEARNER","FACULTY","MENTOR"] as const){
   const downgraded:RequestContext={
    ...actor,membership:{...actor.membership!,roles:[role]},
   };
   await expect(getSectionOperationsWorkspace(downgraded,section))
    .rejects.toMatchObject({name:"AuthorizationError"});
  }
  expect(mock.select).not.toHaveBeenCalled();
  expect(mock.roster).not.toHaveBeenCalled();
  expect(mock.faculty).not.toHaveBeenCalled();
 });

 it("COL-classes-tenant-02 composes only selected section's data and all dependent queries with same acting context",async()=>{
  mock.scope.mockResolvedValue({id:section,collegeId:college,organizationId:org});
  const current={id:section,name:"A",code:"A",programId:program,cohortId:cohort,
   academicPeriodName:"2026",academicPeriodCode:"2026",status:"ACTIVE"};
  const learnerChoice={membershipId:"66666666-6666-4666-8666-666666666666",displayName:"Learner"};
  const facultyChoice={membershipId:"77777777-7777-4777-8777-777777777777",displayName:"Faculty"};
  mock.rows.push([current],[learnerChoice],[facultyChoice]);
  mock.enrollments.mockResolvedValue([{id:"enrollment"}]);
  mock.roster.mockResolvedValue([{id:"roster"}]);
  mock.faculty.mockResolvedValue([{id:"faculty"}]);
  mock.schedule.mockResolvedValue([{id:"session"}]);
  mock.courses.mockResolvedValue([{id:"course"}]);
  const workspace=await getSectionOperationsWorkspace(actor,section);
  expect(workspace.collegeId).toBe(college);
  expect(workspace.section).toEqual(current);
  expect(workspace.programEnrollments).toEqual([{id:"enrollment"}]);
  expect(workspace.roster).toEqual([{id:"roster"}]);
  expect(workspace.facultyAssignments).toEqual([{id:"faculty"}]);
  expect(workspace.scheduleEvents).toEqual([{id:"session"}]);
  expect(workspace.courseChoices).toEqual([{id:"course"}]);
  expect(workspace.learnerChoices).toEqual([learnerChoice]);
  expect(workspace.facultyChoices).toEqual([facultyChoice]);
  expect(mock.enrollments).toHaveBeenCalledWith(actor,program,cohort);
  expect(mock.roster).toHaveBeenCalledWith(actor,section);
  expect(mock.faculty).toHaveBeenCalledWith(actor,section,true);
  expect(mock.schedule).toHaveBeenCalledWith(actor,section);
  expect(mock.courses).toHaveBeenCalledWith(actor,section);
  expect(mock.select).toHaveBeenCalledTimes(3);

 });
 it("COL-classes-tenant-03 orphaned/corrupt section period cannot expose a foreign college academic period",async()=>{
  const s=readFileSync("src/modules/academics/section-workspace.ts","utf8");
  expect(s).toContain("eq(academicPeriods.collegeId, scope.collegeId)");
  const central=readFileSync("src/modules/academics/scope.ts","utf8");
  const sectionScope=central.slice(central.indexOf("export async function loadSectionScope("));
  expect(sectionScope).toContain("eq(academicPeriods.id, sections.academicPeriodId)");
  expect(sectionScope).toContain("eq(academicPeriods.collegeId, departments.collegeId)");
  expect(sectionScope).toContain('throw new AcademicsServiceError(');
  expect(sectionScope).toContain('"SECTION_NOT_FOUND"');
  expect(s).toContain("loadSectionScope(sectionId)");
  expect(s).toContain('requirePermission(context, "academics.manage"');
  mock.scope.mockResolvedValue({id:section,collegeId:college,organizationId:org});
  mock.rows.push([]);
  await expect(getSectionOperationsWorkspace(actor,section))
   .rejects.toMatchObject({code:"SECTION_NOT_FOUND"});
  expect(mock.enrollments).not.toHaveBeenCalled();
  expect(mock.roster).not.toHaveBeenCalled();
 });
});