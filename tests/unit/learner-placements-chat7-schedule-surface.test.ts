import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Chat-7 schedule parity",()=>{
 it("LEARNER-placements-08 links only scheduled rounds to a real reschedule request",()=>{
  const s=read("src/components/placements/learner-placements-dashboard.tsx");
  expect(s).toContain('requestRoundId="+encodeURIComponent(event.roundId)');
  expect(s).toContain("Ask to reschedule");
 });
 it("LEARNER-placements-40 shows persisted rescheduled state",()=>{
  const s=read("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(s).toContain("{row.exception ? (");
  expect(s).toContain("Rescheduled · The time");
  expect(s).toContain("row.exception?.scheduledAt??row.scheduledAt");
 });
 it("LEARNER-placements-41 exposes online assessments without pretending schedule is attendance",()=>{
  const s=read("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(s).toContain("getLearnerPlacementRequestWorkspace(context)");
  expect(s).toContain("row.testUrl");
  expect(s).toContain("Open test");
  expect(s).toContain('rel="noopener noreferrer"');
  expect(s).toContain("not an attendance confirmation or final outcome");
 });
});
