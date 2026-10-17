import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Application note amendments enforce selected-college permission",()=>{
 it("SA-placements-projects-21 requires persisted permissions on the note correction write",()=>{
  const s=readFileSync("src/modules/placements/college-application-detail-service.ts","utf8");
  const note=s.split("export async function appendCollegeApplicationNote(")[1]
    ?.split("export async function attachCollegeApplicationOfferLetter(")[0]??"";
  expect(note).toContain('assertPersistedPlatformPermission(tx,ctx,"placements.manage"');
  expect(note).toContain('eq(placementApplicationNotes.side,"TPO")');
  expect(note).toContain("amendsNoteId");
  expect(note).toContain("await tx.insert(activityEvents)");
 });
});
