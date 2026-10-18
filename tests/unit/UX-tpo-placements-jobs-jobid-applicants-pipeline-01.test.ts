import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-placements-jobs-jobid-applicants-pipeline-01 /tpo/placements/jobs/[jobId]/applicants-pipeline",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toMatch(/min-h-(?:9|10)\b/);
    expect(source).not.toContain("<main");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
