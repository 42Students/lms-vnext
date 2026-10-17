import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("College Admin placements copy",()=>{
 it("COL-placements-16 restores company directory legacy title description and empty copy",()=>{
  const page=readFileSync("src/app/(authenticated)/college/companies/page.tsx","utf8");
  const company=readFileSync("src/components/placements/placement-employer-relationships.tsx","utf8");
  for(const file of [page,company])expect(file).toContain("Maintain each recruiting company once and reuse it across drives.");
  expect(company).toContain("No companies yet.");
  expect(company).not.toContain("Keep recruiter ownership and trust decisions private");
 });
});
