import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {publicPlacementPublicationInput} from "@/modules/placements/public-page/publication-policy";
describe("T-S2-08 public publishing remains a scoped TPO setting",()=>{
 it("keeps the new setting reachable",()=>{
  const settings=readFileSync("src/app/(authenticated)/tpo/settings/page.tsx","utf8");
  expect(settings).toContain('href="/tpo/settings/public-page"');
  expect(settings).toContain("Public placements settings");
 });
 it("does not accept population claims through an opt-in request",()=>{
  expect(publicPlacementPublicationInput.safeParse({enabled:true,collegeId:"other",populationCount:1000}).success).toBe(false);
 });
});
