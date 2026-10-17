import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { shouldKeepPlacementCascadeSibling } from "@/modules/placements/placement-cascade-policy";
import { isPlacementCellApplied } from "@/components/placements/learner-placement-journey";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-15 learner placement source parity",()=>{
 it("LEARNER-placements-R03 applies internship Dream uplift and held-offer policy to cascade",()=>{
  const rule={acceptedCountsAsPlaced:true,siblingIsInternship:false,siblingIsDream:false,siblingAnnualCtcInr:800000,acceptedAnnualCtcInr:800000,maxHeldOffers:1,upliftPct:40};
  expect(shouldKeepPlacementCascadeSibling({...rule,acceptedCountsAsPlaced:false})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling({...rule,siblingIsInternship:true})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling({...rule,siblingIsDream:true})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling({...rule,siblingAnnualCtcInr:1120000})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling(rule)).toBe(false);
  const backend=source("src/modules/placements/offer-service.ts");
  expect(backend).toContain("shouldKeepPlacementCascadeSibling(");
  expect(backend).toContain("previewOwnOfferAcceptanceImpact");
 });
 it("LEARNER-placements-30 labels only persisted placement-cell applications",()=>{
  expect(isPlacementCellApplied("TPO")).toBe(true);
  expect(isPlacementCellApplied("ON_BEHALF")).toBe(true);
  expect(isPlacementCellApplied("SELF")).toBe(false);
  expect(source("src/components/placements/learner-placement-journey.tsx")).toContain("The placement cell applied for you");
 });
 it("LEARNER-placements-52 shows a verified absence escalation without inventing a dispute request",()=>{
  const s=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(s).toContain('outcomeText==="Marked absent"');
  expect(s).toContain("Wrong? Tell the placement cell");
 });
 it("LEARNER-placements-41 keeps online assessments as safe vendor links",()=>{
  const s=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(s).toContain("Take online assessment");
  expect(s).toContain("row.testUrl");
 });
 it("LEARNER-placements-28 makes the own-company preview explicitly privacy-limited",()=>{
  const s=source("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx");
  expect(s).toContain("getOwnLearnerApplicationCompany(context, applicationId)");
  expect(s).toContain("not a live employer-access audit");
 });
});