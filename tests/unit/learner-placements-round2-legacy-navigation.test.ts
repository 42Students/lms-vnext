import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Learner Placements legacy request/nav surfaces",()=>{
 it("LEARNER-placements-46 links announcements and personal updates separately",()=>{
  const text=source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
  expect(text).toContain("Updates about you (");
  expect(text).toContain('href="#college-notices"');
  expect(text).toContain('href="#personal-updates"');
 });
 it("LEARNER-placements-54 labels pending and rejected requests as placement cell decisions",()=>{
  const text=source("src/components/placements/learner-placement-requests.tsx");
  expect(text).toContain("Waiting for the placement cell");
  expect(text).toContain("Not approved");
  expect(text).toContain("Reply:");
  expect(text).toContain("Tell the placement cell why");
 });
 it("LEARNER-placements-55 provides all three anchored placement cell sections",()=>{
  const text=source("src/app/(authenticated)/learn/my-placements/placement/page.tsx");
  for(const id of ["registration","requests","rules"])expect(text).toContain('id="'+id+'"');
  expect(text).toContain("Placement rules");
 });
});