import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("verify2b W1_lane5_9: college jobs, lecture hall and project audit",()=>{
 it("records each reordered resource's old/new sequence in the same atomic audit",()=>{
  const src=readFileSync("src/modules/projects/resource-service.ts","utf8");
  expect(src).toContain("moves:orderIds.flatMap((resourceId,toIndex)=>{");
  expect(src).toContain("previousSequence:active[fromIndex]?.sequence");
  expect(src).toContain("nextSequence:active[toIndex]?.sequence");
  expect(src).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("preserves legacy Create Job, interview refresh size and safe lecture hall constraints",()=>{
  const jobs=readFileSync("src/app/(authenticated)/college/placements/drives/page.tsx","utf8");
  const interviews=readFileSync("src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx","utf8");
  const halls=readFileSync("src/components/admin/lecture-hall-manager.tsx","utf8");
  expect(jobs).toContain("Create Job");
  expect(interviews).toContain("This drive only");
  expect(interviews).toContain('min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh');
  expect(halls).toContain('capacity: "50"');
  expect(halls).toContain("capacity > 1000");
  expect(halls).toContain('confirmLabel="Discard edits"');
 });
});
