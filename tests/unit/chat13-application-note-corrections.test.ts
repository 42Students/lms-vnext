import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-placements-projects-21 audited internal note correction",()=>{
 it("SA-placements-projects-21 only amends a note belonging to the same scoped application",()=>{
  const s=read("src/modules/placements/college-application-detail-service.ts");
  expect(s).toContain("amendsNoteId:z.uuid().optional()");
  expect(s).toContain("eq(placementApplicationNotes.applicationId,parent.id)");
  expect(s).toContain('eq(placementApplicationNotes.side,"TPO")');
  expect(s).toContain("await tx.insert(placementApplicationNotes)");
  expect(s).toContain("amendsNoteId:input.amendsNoteId??null");
 });
 it("SA-placements-projects-21 exposes legacy Edit Internal Notes and audited revisions",()=>{
  const s=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(s).toContain("Edit Internal Notes");
  expect(s).toContain("Notes updated");
  expect(s).toContain("amendsNoteId");
  expect(s).toContain("Save correction");
  expect(s).toContain("preserves its history");
 });
});
