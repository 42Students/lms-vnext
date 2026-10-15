import {describe,it,expect} from "vitest";
import {filterLearnerScheduleByKind} from "@/modules/academics/learner-schedule-kind-filter-model";
const event=[{id:"course",deliveryId:"11111111-1111-4111-8111-111111111111"},{id:"general",deliveryId:null}];
describe("learner Class Schedule event kind",()=>{
 it("separates Course delivery classes from authenticated general section events",()=>{
  expect(filterLearnerScheduleByKind(event,"COURSE")).toEqual([event[0]]);
  expect(filterLearnerScheduleByKind(event,"SECTION")).toEqual([event[1]]);
 });
 it("invalid or all selection shows only original scoped events",()=>{
  expect(filterLearnerScheduleByKind(event,"BOGUS")).toEqual(event);
  expect(filterLearnerScheduleByKind(event,"ALL")).toEqual(event);
 });
});
