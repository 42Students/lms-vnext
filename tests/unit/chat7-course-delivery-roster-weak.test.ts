import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const state=vi.hoisted(()=>({select:vi.fn(),elective:[] as unknown[],learners:[] as unknown[],queries:[] as string[]}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listActiveDeliveryLearners} from "@/modules/courses/delivery-roster";

const scope={deliveryId:"11111111-1111-4111-8111-111111111111",
 sectionId:"22222222-2222-4222-8222-222222222222",
 academicPeriodId:"33333333-3333-4333-8333-333333333333",
 collegeId:"44444444-4444-4444-8444-444444444444"};
const result={membershipId:"member1",displayName:"Learner A",email:"a@school.invalid",
 phoneE164:null,rollNumber:"CS01"};
beforeEach(()=>{
 state.select.mockReset();state.elective=[];state.learners=[];
 let step=0;
 state.select.mockImplementation(()=>{
  const which=step++===0?"elective":"roster";
  return {from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
   where(){return this;},
   orderBy(){return Promise.resolve(state.learners);},
   limit(){return Promise.resolve(state.elective);},
  };
 });
});
describe("COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates",()=>{
 it("returns only authorized Section learners when no active elective offering backs delivery",async()=>{
  state.learners=[result];
  const rows=await listActiveDeliveryLearners(scope);
  expect(rows).toEqual([result]);
  expect(state.select).toHaveBeenCalledTimes(2);
 });
 it("uses elective group learners instead of leaking the normal Section roster for elective-backed delivery",async()=>{
  state.elective=[{groupId:"group-1"}];
  state.learners=[{...result,membershipId:"elective-member"}];
  expect(await listActiveDeliveryLearners(scope)).toEqual(state.learners);
  expect(state.select).toHaveBeenCalledTimes(2);
 });
 it("returns no rows when selected college has no authorized learners",async()=>{
  state.learners=[];
  expect(await listActiveDeliveryLearners(scope)).toEqual([]);
 });
 it("source query guards both paths by persisted ACTIVE user, College, learner role and exact course scope",()=>{
  const text=readFileSync("src/modules/courses/delivery-roster.ts","utf8");
  expect(text).toContain('eq(collegeMemberships.collegeId, scope.collegeId)');
  expect(text).toContain('eq(collegeMemberships.status, "ACTIVE")');
  expect(text).toContain('eq(users.platformStatus, "ACTIVE")');
  expect(text).toContain('eq(membershipRoles.role, "LEARNER")');
  expect(text).toContain('eq(electiveSlots.collegeId, scope.collegeId)');
  expect(text).toContain('eq(lmsGroups.collegeId, scope.collegeId)');
  expect(text).toContain('eq(electiveOfferings.backedDeliveryId, scope.deliveryId)');
  expect(text).toContain('eq(sectionEnrollments.sectionId, scope.sectionId)');
  // Whitespace-insensitive but still requires equality with this delivery's period.
  expect(text).toMatch(/eq\(\s*sectionEnrollments\.academicPeriodId\s*,\s*scope\.academicPeriodId\s*\)/);
  expect(text).toContain('eq(sectionEnrollments.status, "ACTIVE")');
 });
});
