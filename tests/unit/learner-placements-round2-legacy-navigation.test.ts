import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Learner Placements legacy request/nav surfaces",()=>{
 it("LEARNER-placements-46 links announcements and personal updates separately",()=>{
  const text=source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
  expect(text).toContain("Updates about you (");
  expect(text).toContain('<Link href={tabHref("announcements")}');
  expect(text).toContain('<section id="college-notices"');
  expect(text).toContain('<Link href={tabHref("updates")}');
  expect(text).toContain('id="personal-updates"');
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
  for(const id of ["requests","rules"])expect(text).toContain('id="'+id+'"');
  expect(text).toContain("<LearnerPlacementRegistration");
  expect(source("src/components/placements/learner-placement-registration.tsx")).toContain('id="registration"');
  expect(text).toContain("Placement rules");
 });
});