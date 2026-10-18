import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({
 scope:vi.fn(),enrollments:vi.fn(),roster:vi.fn(),faculty:vi.fn(),
 events:vi.fn(),choices:vi.fn(),queries:0,
 where:[] as Array<{sql:string;params:unknown[]}>,
 section:null as Record<string,unknown>|null,
}));
vi.mock("@/modules/academics/scope",()=>({loadSectionScope:state.scope}));
vi.mock("@/modules/academics/enrollment-service",()=>({
 listLearnerProgramEnrollments:state.enrollments,
}));
vi.mock("@/modules/academics/roster-service",()=>({listSectionRoster:state.roster}));
vi.mock("@/modules/academics/faculty-assignment-service",()=>({
 listSectionFacultyAssignments:state.faculty,
}));
vi.mock("@/modules/academics/schedule-service",()=>({
 listSectionScheduleEvents:state.events,
 listSectionScheduleCourseChoices:state.choices,
}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:(projection:Record<string,unknown>)=>{
  state.queries++;
  const section=Boolean("programName" in projection && "academicPeriodName" in projection);
  const dialect=new PgDialect();
  class Query {
   from(){return this;}
   innerJoin(){return this;}
   where(expression:SQL){
    const query=dialect.sqlToQuery(expression);
    state.where.push({sql:query.sql,params:query.params});
    return this;
   }
   async orderBy(){return [];}
   async limit(){return section&&state.section?[state.section]:[];}
  }
  return new Query();
 },
})}));
import {getSectionOperationsWorkspace} from "@/modules/academics/section-workspace";

const sectionId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const otherCollege="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const programId="55555555-5555-4555-8555-555555555555";
const cohortId="66666666-6666-4666-8666-666666666666";
function actor(role:"COLLEGE_ADMIN"|"FACULTY"|"MENTOR"|"LEARNER"="COLLEGE_ADMIN"):RequestContext {
 return {
  user:{id:"college-user",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"member",collegeId,organizationId,status:"ACTIVE",roles:[role]},
 };
}
beforeEach(()=>{
 vi.resetAllMocks();state.queries=0;state.where=[];
 state.scope.mockResolvedValue({collegeId,organizationId});
 state.section={id:sectionId,name:"Section A",code:"A",status:"ACTIVE",capacity:35,
  cohortId,programId,academicPeriodId:"period",academicPeriodName:"Semester 1",
  academicPeriodCode:"S1",programName:"Computer Science",programCode:"CSE"};
 for(const mock of [state.enrollments,state.roster,state.faculty,
  state.events,state.choices])mock.mockResolvedValue([]);
});
describe("SA-ACADEMICS-SECTION-OPS-01 privileged Section operational view",()=>{
 it("preserves complete authorized Section children and validates academic period college at SQL level",async()=>{
  const result=await getSectionOperationsWorkspace(actor(),sectionId);
  expect(result.section).toMatchObject({id:sectionId,programId,cohortId});
  expect(result.collegeId).toBe(collegeId);
  expect(result).toMatchObject({
   programEnrollments:[],roster:[],facultyAssignments:[],
   scheduleEvents:[],learnerChoices:[],facultyChoices:[],courseChoices:[],
  });
  expect(state.enrollments).toHaveBeenCalledWith(expect.anything(),programId,cohortId);
  expect(state.roster).toHaveBeenCalledWith(expect.anything(),sectionId);
  expect(state.faculty).toHaveBeenCalledWith(expect.anything(),sectionId,true);
  expect(state.events).toHaveBeenCalledWith(expect.anything(),sectionId);
  expect(state.choices).toHaveBeenCalledWith(expect.anything(),sectionId);
  const period=state.where.find(row=>row.sql.includes('"academic_periods"."college_id"'));
  expect(period?.params).toContain(collegeId);
  expect(period?.params).toContain(sectionId);
 });
 it("denies Faculty, Mentor, Learner, inactive and wrong-college Admin before detailed SQL",async()=>{
  const admin=actor();
  const blocked=[
   actor("FACULTY"),actor("MENTOR"),actor("LEARNER"),
   {...admin,membership:{...admin.membership!,status:"SUSPENDED" as const}},
   {...admin,user:{...admin.user,platformStatus:"DISABLED" as const}},
   {...admin,membership:{...admin.membership!,collegeId:otherCollege}},
  ];
  for(const principal of blocked)
   await expect(getSectionOperationsWorkspace(principal,sectionId))
    .rejects.toThrow("Missing permission: academics.manage");
  expect(state.queries).toBe(0);
  expect(state.roster).not.toHaveBeenCalled();
 });
 it("denies another college's academic period even when the Section ID resolves",async()=>{
  state.section=null;
  await expect(getSectionOperationsWorkspace(actor(),sectionId))
   .rejects.toMatchObject({code:"SECTION_NOT_FOUND"});
  expect(state.queries).toBe(1);
  expect(state.roster).not.toHaveBeenCalled();
  expect(state.enrollments).not.toHaveBeenCalled();
 });
 it("rejects a malformed Section ID before the scope lookup or dependent queries",async()=>{
  await expect(getSectionOperationsWorkspace(actor(),"not-uuid")).rejects.toThrow();
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.queries).toBe(0);
 });
});
