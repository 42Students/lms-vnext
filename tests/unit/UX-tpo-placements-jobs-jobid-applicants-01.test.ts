import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-placements-jobs-jobid-applicants-01 /tpo/placements/jobs/[jobId]/applicants",()=>{
  it("preserves canonical destination",()=>{
    expect(source).toContain("redirect(");
  });
});
