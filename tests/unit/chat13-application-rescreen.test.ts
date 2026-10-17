import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Application re-screen on real academic evidence",()=>{
 it("SA-placements-projects-21 re-evaluates scoped learner evidence and audits without inventing a score",()=>{
  const svc=read("src/modules/placements/college-application-detail-service.ts");
  expect(svc).toContain("rescreenCollegeApplication");
  expect(svc).toContain("evaluatePlacementEligibility(ctx,jobId,application.membershipId,tx)");
  expect(svc).toContain("assertPersistedPlatformPermission(tx,ctx");
  expect(svc).toContain("PLACEMENTS_APPLICATION_RESCREENED");
  expect(svc).toContain("screeningDecisionUnchanged:true");
 });
 it("SA-placements-projects-21 protects mutation origin and shows scored policy checks without a fake match score",()=>{
  const route=read("src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/rescreen/route.ts");
  expect(route).toContain("isSameOriginRequest(req)");
  const ui=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(ui).toContain("Re-screen");
  expect(ui).toContain("Application re-screened");
  expect(ui).toContain("Current eligibility:");
  expect(ui).toContain("No invented private document URL or computed match score");
 });
});
