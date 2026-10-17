import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO drive discussion handoff",()=>{
 it("TPO-inbox-team-07 keeps scoped recruiter discussion reachable from drive and legacy tab alias",()=>{
  const job=src("src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx");
  const service=src("src/modules/placements/tpo-drive-discussion-service.ts");
  const discussion=src("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(job).toContain('"discussion","about"');
  expect(job).toContain('/discussion"}');
  expect(service).toContain("eq(placementTpoMessageThreads.collegeId,collegeId)");
  expect(service).toContain("eq(placementTpoMessageThreads.jobId,jobId)");
  expect(discussion).toContain("thread.lastPreview");
  expect(discussion).toContain(">Discuss</Link>");
  expect(discussion).toContain('"/tpo/messages/"+encodeURIComponent(thread.id)');
 });
});
