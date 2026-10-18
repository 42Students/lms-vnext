import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {buildHrOfferOverview} from "@/modules/placements/hr-offer-selection-read-model";

const now=new Date("2099-05-01T10:00:00.000Z");
const offer=(status:string,joiningStatus:string|null)=>({
 id:status,applicationId:status,status,expiresAt:null,joiningStatus,
});
describe("HR-OFFERS-86: recruiter Hired stage uses accepted, joined offer only",()=>{
 it("does not promote declined, revoked, issued or withdrawn offers from stale JOINED outcomes",()=>{
  const result=buildHrOfferOverview([
   offer("DECLINED","JOINED"),offer("WITHDRAWN","JOINED"),
   offer("REVOKED","JOINED"),offer("ISSUED","JOINED"),
  ],now);
  expect(result.joined).toBe(0);
  expect(result.recorded).toBe(4);
 });
 it("accepts an actual accepted offer with a persisted joined outcome exactly once",()=>{
  const result=buildHrOfferOverview([offer("ACCEPTED","JOINED"),offer("ACCEPTED","NOT_JOINED")],now);
  expect(result.accepted).toBe(2);
  expect(result.joined).toBe(1);
 });
 it("recruiter SQL Hired funnel applies the same accepted-plus-joined condition",()=>{
  const src=readFileSync(join(process.cwd(),"src/modules/placements/hr-job-read-service.ts"),"utf8");
  const start=src.indexOf("const hasJoinedOffer=");
  const end=src.indexOf("const stageConditions:",start);
  expect(start).toBeGreaterThan(-1);
  const predicate=src.slice(start,end);
  expect(predicate).toContain('eq(placementOffers.status,"ACCEPTED")');
  expect(predicate).toContain('eq(placementJoiningOutcomes.status,"JOINED")');
  expect(predicate).toContain("eq(placementOffers.applicationId,placementApplications.id)");
 });
});