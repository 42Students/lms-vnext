import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
const state=vi.hoisted(()=>({
 academic:vi.fn(),offering:vi.fn(),permission:vi.fn(),
 select:vi.fn(),rows:[] as unknown[],results:[] as unknown[][],
}));
vi.mock("@/modules/academics/scope",()=>({loadAcademicCollegeScope:state.academic}));
vi.mock("@/modules/courses/scope",()=>({loadCourseOfferingScope:state.offering}));
vi.mock("@/modules/permissions/policy",()=>({requirePermission:state.permission}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listCollegeFacultyPicker} from "@/modules/courses/college-faculty-picker-service";
import {listOfferingTeachingOverview} from "@/modules/courses/college-course-teachers-service";
import {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";

const id="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const offering={id,collegeId,organizationId:"org-1",cohortId:"cohort",academicPeriodId:"period"};
const context={} as Parameters<typeof listCollegeFacultyPicker>[0];
const lesson=[] as const;
beforeEach(()=>{
 state.academic.mockReset();state.offering.mockReset();state.permission.mockReset();state.select.mockReset();
 state.academic.mockResolvedValue({id:collegeId,organizationId:"org-1"});
 state.offering.mockResolvedValue(offering);
 state.rows=[];state.results=[];
 state.select.mockImplementation(()=>({
  from(){return this;},innerJoin(){return this;},where(){return this;},
  orderBy(){return this;},
  limit(){return Promise.resolve(state.results.length?state.results.shift():state.rows);},
 }));
});
describe("COURSES-WEAK-READERS-01 bounded college/Faculty/section authoring readers",()=>{
 it("Faculty picker calls college resolver first, filters active Faculty role and caps 500 with truthful truncation",async()=>{
  state.rows=Array.from({length:501},(_,i)=>({
   membershipId:"member-"+i,displayName:i%2?"Lecturer "+i:null,email:"faculty"+i+"@college.invalid",
  }));
  const result=await listCollegeFacultyPicker(context,collegeId);
  expect(state.academic).toHaveBeenCalledWith(collegeId);
  expect(state.permission).toHaveBeenCalledWith(context,"courses.manage",{
   collegeId,organizationId:"org-1",
  });
  expect(result.faculty).toHaveLength(500);
  expect(result.truncated).toBe(true);
  expect(result.faculty[0]?.displayName).toContain("faculty0@");
  const sql=readFileSync("src/modules/courses/college-faculty-picker-service.ts","utf8");
  expect(sql).toContain('eq(membershipRoles.role,"FACULTY")');
  expect(sql).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(sql).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(sql).toContain('eq(collegeMemberships.status,"ACTIVE")');
 });
 it("offering teaching overview respects exact offering and college scope and reports capped roster",async()=>{
  state.rows=Array.from({length:101},(_,i)=>({
   assignmentId:"assignment-"+i,facultyName:"Faculty "+i,
  }));
  const result=await listOfferingTeachingOverview(context,id);
  expect(state.offering).toHaveBeenCalledWith(id);
  expect(state.permission).toHaveBeenCalledWith(context,"courses.read",{
   collegeId,organizationId:"org-1",
  });
  expect(result.faculty).toHaveLength(100);
  expect(result.truncated).toBe(true);
  const sql=readFileSync("src/modules/courses/college-course-teachers-service.ts","utf8");
  expect(sql).toContain("eq(courseSectionDeliveries.offeringId,offering.id)");
  expect(sql).toContain("eq(collegeMemberships.collegeId,offering.collegeId)");
  expect(sql).toContain('eq(users.platformStatus,"ACTIVE")');
 });
 it("section preview rejects stale/foreign selection rather than infer another college's content",async()=>{
  state.results=[[{deliveryId:"known",sectionName:"A",sectionCode:"A"}],[]];
  const result=await listOfferingSectionPreview(context,id,"foreign",lesson,false);
  expect(state.offering).toHaveBeenCalledWith(id);
  expect(state.permission).toHaveBeenCalledWith(context,"courses.manage",{
   collegeId,organizationId:"org-1",
  });
  expect(result.selected).toBeNull();
  expect(result.invalid).toBe(true);
  expect(result.lessons).toEqual([]);
  expect(state.select).toHaveBeenCalledTimes(2);
 });
 it("section preview re-authorizes valid selected class outside capped 200-option page",async()=>{
  const visible=Array.from({length:201},(_,i)=>({deliveryId:"delivery-"+i,sectionName:"Class "+i,sectionCode:"C"+i}));
  const late=visible[200]!;
  state.results=[visible,[late]];
  const result=await listOfferingSectionPreview(context,id,late.deliveryId,lesson,true);
  expect(result.truncated).toBe(true);
  expect(result.selected).toEqual(late);
  expect(result.invalid).toBe(false);
  expect(result.options).toHaveLength(201);
  expect(state.select).toHaveBeenCalledTimes(2);
  const sql=readFileSync("src/modules/courses/college-offering-section-preview-service.ts","utf8");
  expect(sql).toContain("eq(courseSectionDeliveries.offeringId,offering.id)");
  expect(sql).toContain("eq(sections.cohortId,offering.cohortId)");
  expect(sql).toContain("eq(sections.academicPeriodId,offering.academicPeriodId)");
 });
 it("denied college/offering resolvers fail before permissions or DB query execution",async()=>{
  state.academic.mockRejectedValueOnce(new Error("Other college"));
  await expect(listCollegeFacultyPicker(context,collegeId)).rejects.toThrow();
  state.offering.mockRejectedValueOnce(new Error("Other offering"));
  await expect(listOfferingTeachingOverview(context,id)).rejects.toThrow();
  expect(state.permission).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
});
