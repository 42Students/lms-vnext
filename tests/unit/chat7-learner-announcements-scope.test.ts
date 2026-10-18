import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 learnerGuard:vi.fn(),select:vi.fn(),tableExists:vi.fn(),
 sections:[] as Array<{id:string}>,
 notices:[] as Array<{id:string;title:string;messageText:string}>,
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
vi.mock("@/modules/courses/learner-access-guard",()=>({requireOwnCourseLearnerRead:state.learnerGuard}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:state.tableExists}));
import {listLearnerCourseClassAnnouncements} from "@/modules/courses/learner-course-announcements-service";

const member={id:"11111111-1111-4111-8111-111111111111",
 collegeId:"22222222-2222-4222-8222-222222222222",
 organizationId:"33333333-3333-4333-8333-333333333333",status:"ACTIVE",roles:["LEARNER"]};
const context={user:{id:"44444444-4444-4444-8444-444444444444",platformStatus:"ACTIVE"},membership:member} as unknown as RequestContext;
const section="55555555-5555-4555-8555-555555555555";
const now=new Date("2099-01-01T00:00:00.000Z");
beforeEach(()=>{
 state.learnerGuard.mockReset().mockResolvedValue(member);
 state.select.mockReset();state.tableExists.mockReset().mockResolvedValue(true);
 state.sections=[{id:section}];state.notices=[{id:"notice",title:"Exam",messageText:"Your exam is scheduled."}];
 let call=0;
 state.select.mockImplementation(()=>{
  const selected=call++===0?state.sections:state.notices;
  return {from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
   where(){return this;},orderBy(){return this;},limit:async()=>selected};
 });
});
describe("LEARNER-COURSE-NOTICES-01 active Section announcement visibility",()=>{
 it("denies revoked or foreign learner before any Section or announcement query",async()=>{
  state.learnerGuard.mockRejectedValueOnce(Error("revoked"));
  await expect(listLearnerCourseClassAnnouncements(context,section,now)).rejects.toThrow();
  expect(state.select).not.toHaveBeenCalled();
  expect(state.tableExists).not.toHaveBeenCalled();
 });
 it("returns no announcements without a current eligible Section",async()=>{
  state.sections=[];
  expect(await listLearnerCourseClassAnnouncements(context,section,now)).toEqual([]);
  expect(state.select).toHaveBeenCalledTimes(1);
  expect(state.tableExists).not.toHaveBeenCalled();
 });
 it("fails closed when registered class-announcement storage is not provisioned",async()=>{
  state.tableExists.mockResolvedValue(false);
  expect(await listLearnerCourseClassAnnouncements(context,section,now)).toEqual([]);
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("reads only after validated persisted learner scope and registered announcement table",async()=>{
  expect(await listLearnerCourseClassAnnouncements(context,section,now)).toEqual(state.notices);
  expect(state.learnerGuard).toHaveBeenCalledWith(context);
  expect(state.tableExists).toHaveBeenCalledWith("announcements");
  expect(state.select).toHaveBeenCalledTimes(2);
 });
 it("requires active Section, matching cohort/period, target college and unexpired official notice",()=>{
  const src=readFileSync("src/modules/courses/learner-course-announcements-service.ts","utf8");
  for(const part of [
   'eq(learnerProgramEnrollments.status,"ACTIVE")',
   'eq(sectionEnrollments.status,"ACTIVE")',
   'eq(sections.status,"ACTIVE")',
   'eq(sections.cohortId,learnerProgramEnrollments.cohortId)',
   'eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId)',
   'eq(db10Announcements.collegeId,member.collegeId)',
   'eq(db10Announcements.organizationId,member.organizationId)',
   'eq(db10Announcements.receiverType,"CLASS")',
   'eq(db10Announcements.receiverId,sectionId)',
   'inArray(db10Announcements.senderType,["COLLEGE_ADMIN","FACULTY"])',
   'isNull(db10Announcements.deletedAt)',
   'gt(db10Announcements.expiresAt,now)',
  ])expect(src).toContain(part);
  expect(src).toContain(".limit(2)");
 });
});
