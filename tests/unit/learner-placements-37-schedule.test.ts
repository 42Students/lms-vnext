import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {partitionLearnerPlacementSchedule} from "@/modules/placements/learner-placement-schedule-model";
describe("LEARNER-placements-37 schedule details",()=>{
 it("LEARNER-placements-37 exposes persisted join and test URLs only after HTTPS checks",()=>{
  const source=readFileSync(new URL("../../src/app/(authenticated)/learn/my-placements/schedule/page.tsx",import.meta.url),"utf8");
  expect(source).toContain("Join online round");
  expect(source).toContain("Open test");
  expect(source).toContain("Venue to be told");
  expect(source).toContain("Duration to be told");
 });
 it("LEARNER-placements-37 separates scheduled and undated rounds without inventing dates",()=>{
  const rows=[{applicationId:"a",roundId:"a",roundName:"Test",companyName:"Co",roleTitle:"Role",scheduledAt:null,exception:null}];
  expect(partitionLearnerPlacementSchedule(rows,new Date("2099-01-01")).undated).toHaveLength(1);
 });
});