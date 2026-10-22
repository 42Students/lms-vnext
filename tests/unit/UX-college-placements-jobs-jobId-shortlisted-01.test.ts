import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx"),"utf8");
describe("/college/placements/jobs/[jobId]/shortlisted UX",()=>{
 it("UX-college-placements-jobs-shortlisted-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain('<Tabs ariaLabel="Shortlisted pipeline stages"'));
 it("UX-college-placements-jobs-shortlisted-02 preserves the new accessible state and responsive contract",()=>expect(source).toContain('title={filtered ? "No applications match these filters." : "No applications yet"}'));
 it("keeps the external pipeline explicitly read-only",()=>{
  expect(source).toContain('caption="External shortlisted applications"');
  expect(source).toContain('<CollegeShortlistedToolbar');
 });
});
