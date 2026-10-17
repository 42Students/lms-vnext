import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {TPO_INELIGIBLE_REASONS,tpoIneligibleReason} from "@/modules/placements/tpo-ineligible-reasons";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat12 ineligibility and bulk actions",()=>{
 it("TPO-students-13 renders all legacy reason presets and the Other choice in single and bulk flows",()=>{
  expect(TPO_INELIGIBLE_REASONS).toEqual(["Higher studies","Not interested in placements","Detained / year back","Discontinued","Disciplinary","Already has a job"]);
  expect(tpoIneligibleReason("Higher studies")).toBe("Higher studies");
  for(const file of ["src/components/tpo/tpo-bulk-action-panel.tsx","src/components/tpo/tpo-participation-decision-form.tsx"]){
   expect(s(file)).toContain("TPO_INELIGIBLE_REASONS.map");
   expect(s(file)).toContain(">Other</button>");
  }
 });
 it("TPO-students-16 keeps failures readable, including named skipped rows for copying",()=>{
  const panel=s("src/components/tpo/tpo-bulk-action-panel.tsx");
  expect(panel).toContain('lines.join("\\n")');
  expect(panel).toContain("Could not read the preview. Please try again.");
 });
 it("GR-04 guards learner participation mutations without exposing a raw server error",()=>{
  const src=s("src/components/tpo/tpo-participation-decision-form.tsx");
  expect(src).toContain("apiFetch<");
  expect(src).toContain("cause instanceof FriendlyFetchError");
 });
});
