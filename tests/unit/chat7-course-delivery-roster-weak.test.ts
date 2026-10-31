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
   // Model the real Drizzle thenable when the group roster query is awaited.
   then(resolve:(rows:unknown[])=>unknown,reject?:(reason:unknown)=>unknown){
    return Promise.resolve(which==="roster"?state.learners:state.elective).then(resolve,reject);
   },
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
  expect(state.select).toHaveBeenCalledTimes(3);
 });
 it("uses elective group learners instead of leaking the normal Section roster for elective-backed delivery",async()=>{
  state.elective=[{groupId:"group-1",offeringStatus:"ACTIVE",offeringDeletedAt:null,slotStatus:"ACTIVE",slotDeletedAt:null,groupStatus:"ACTIVE",groupDeletedAt:null}];
  state.learners=[{...result,membershipId:"elective-member"}];
  expect(await listActiveDeliveryLearners(scope)).toEqual(state.learners);
  expect(state.select).toHaveBeenCalledTimes(2);
 });
 it("COURSES-WEAK-DELIVERY-ROSTER-01 does not expose the Section when its elective was disabled",async()=>{
  state.elective=[{groupId:"group-1",offeringStatus:"INACTIVE",offeringDeletedAt:null,slotStatus:"ACTIVE",slotDeletedAt:null,groupStatus:"ACTIVE",groupDeletedAt:null}];
  state.learners=[result];
  expect(await listActiveDeliveryLearners(scope)).toEqual([]);
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("COURSES-WEAK-DELIVERY-ROSTER-01 never falls back for a deleted elective group",async()=>{
  state.elective=[{groupId:"group-1",offeringStatus:"ACTIVE",offeringDeletedAt:null,slotStatus:"ACTIVE",slotDeletedAt:null,groupStatus:"ACTIVE",groupDeletedAt:new Date("2099-01-01T00:00:00Z")}];
  state.learners=[result];
  expect(await listActiveDeliveryLearners(scope)).toEqual([]);
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("uses the provided transaction reader for ordinary Section and backed-elective rosters",async()=>{
  const tx={
    select:vi.fn((...args:unknown[])=>state.select(...args)),
  } as unknown as Parameters<typeof listActiveDeliveryLearners>[1];
  state.learners=[result];
  expect(await listActiveDeliveryLearners(scope,tx)).toEqual([result]);
  expect(tx?.select).toHaveBeenCalledTimes(3);
  expect(state.select).toHaveBeenCalledTimes(3);

  state.select.mockClear();
  (tx?.select as ReturnType<typeof vi.fn>).mockClear();
  state.elective=[{groupId:"group-1",offeringStatus:"ACTIVE",offeringDeletedAt:null,
    slotStatus:"ACTIVE",slotDeletedAt:null,groupStatus:"ACTIVE",groupDeletedAt:null}];
  // The mock's select plan resets to an elective query for each independent
  // invocation; recreating it via beforeEach semantics is not required here.
  // Every elective access must use the transaction's select, including the
  // nested group-roster helper, not a fresh pooled read.
  let step=0;
  state.select.mockImplementation(()=>{
    const first=step++===0;
    return {from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
      where(){return this;},orderBy(){return this;},
      limit(){return Promise.resolve(state.elective);},
      then(resolve:(rows:unknown[])=>unknown,reject?:(reason:unknown)=>unknown){
        return Promise.resolve(first?state.elective:state.learners).then(resolve,reject);
      },
    };
  });
  state.learners=[{...result,membershipId:"elective-member"}];
  expect(await listActiveDeliveryLearners(scope,tx)).toEqual(state.learners);
  expect(tx?.select).toHaveBeenCalledTimes(2);
 });
 it("COURSES-WEAK-DELIVERY-ROSTER-01 requires the same persisted delivery, cohort, Section and period",()=>{
  const source=readFileSync("src/modules/courses/delivery-roster.ts","utf8");
  for(const clause of [
   'eq(courseSectionDeliveries.id, scope.deliveryId)',
   'eq(courseSectionDeliveries.sectionId, scope.sectionId)',
   'eq(courseOfferings.academicPeriodId, scope.academicPeriodId)',
   'eq(learnerProgramEnrollments.cohortId, courseOfferings.cohortId)',
   'eq(sections.cohortId, courseOfferings.cohortId)',
   'isNull(courseSectionDeliveries.endedAt)',
  ])expect(source).toContain(clause);
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
  // Whitespace- and trailing-comma-insensitive, but requires equality to this delivery's period.
  expect(text).toMatch(/eq\(\s*sectionEnrollments\.academicPeriodId\s*,\s*scope\.academicPeriodId\s*,?\s*\)/);
  expect(text).toContain('eq(sectionEnrollments.status, "ACTIVE")');
 });
});
