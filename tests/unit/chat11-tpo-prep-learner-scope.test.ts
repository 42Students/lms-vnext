import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 validateTpoPrepLearnerPairs,hasEveryScopedTpoPrepLearner,
} from "@/modules/placements/tpo-prep-learner-scope-model";

const one="11111111-1111-4111-8111-111111111111";
const two="22222222-2222-4222-8222-222222222222";
const cohort="33333333-3333-4333-8333-333333333333";
const wrong="44444444-4444-4444-8444-444444444444";

describe("TPO-settings-audit-PREP-SCOPE-02 learner completion privacy",()=>{
 it("retains bounded distinct student/cohort pairs without inventing enrollment",()=>{
  expect(validateTpoPrepLearnerPairs([])).toEqual({membershipIds:[],cohortIds:[]});
  expect(validateTpoPrepLearnerPairs([
   {membershipId:one,cohortId:cohort},
   {membershipId:two,cohortId:cohort},
  ])).toEqual({membershipIds:[one,two],cohortIds:[cohort]});
  expect(hasEveryScopedTpoPrepLearner([
   {membershipId:one,cohortId:cohort},
   {membershipId:two,cohortId:cohort},
  ],[{membershipId:one,cohortId:cohort},{membershipId:two,cohortId:cohort}]))
   .toBe(true);
 });
 it("rejects repeated learner identities, invalid UUIDs and oversized selected rosters",()=>{
  expect(validateTpoPrepLearnerPairs([
   {membershipId:one,cohortId:cohort},{membershipId:one,cohortId:wrong},
  ])).toBeNull();
  expect(validateTpoPrepLearnerPairs([{membershipId:"other",cohortId:cohort}]))
   .toBeNull();
  expect(validateTpoPrepLearnerPairs(Array.from({length:5001},()=>({
   membershipId:one,cohortId:cohort,
  })))).toBeNull();
 });
 it("rejects forged foreign student or mismatched cohort even when the UUIDs are real",()=>{
  const requested=[{membershipId:one,cohortId:cohort}];
  expect(hasEveryScopedTpoPrepLearner(requested,[])).toBe(false);
  expect(hasEveryScopedTpoPrepLearner(requested,[{membershipId:one,cohortId:wrong}]))
   .toBe(false);
  expect(hasEveryScopedTpoPrepLearner(requested,[{membershipId:two,cohortId:cohort}]))
   .toBe(false);
 });
 it("requires persisted role, active user and exact college+enrollment before querying learning progress",()=>{
  const service=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
  const actor=service.indexOf("requireTpoBatchActor(context)");
  const validate=service.indexOf("validateTpoPrepLearnerPairs(learners)");
  const enrollments=service.indexOf(".from(learnerProgramEnrollments)");
  const match=service.indexOf("hasEveryScopedTpoPrepLearner(learners,enrolled)");
  const settings=service.indexOf("getTpoPrepReadiness(context)");
  const progress=service.indexOf(".from(learnerContentProgress)");
  expect(actor).toBeGreaterThan(0);
  expect(validate).toBeGreaterThan(actor);
  expect(enrollments).toBeGreaterThan(validate);
  expect(match).toBeGreaterThan(enrollments);
  expect(settings).toBeGreaterThan(match);
  expect(progress).toBeGreaterThan(settings);
  for(const clause of [
   'eq(collegeMemberships.collegeId,collegeId)',
   'eq(departments.collegeId,collegeId)',
   'eq(membershipRoles.role,"LEARNER")',
   'eq(users.platformStatus,"ACTIVE")',
   'eq(collegeMemberships.status,"ACTIVE")',
  ])expect(service).toContain(clause);
 });
});
