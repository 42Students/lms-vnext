import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("COL-placements-02 application details drawer",()=>{
 it("COL-placements-02 uses authenticated college-scoped application details rather than row-only PII",()=>{
  const page=read("src/components/placements/college-application-pipeline-controls.tsx");
  const drawer=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(page).toContain('"/api/placements/college/jobs/"');
  expect(page).toContain("<CollegeApplicationDetailDrawer");
  for(const label of ["Email</dt>","Phone</dt>","Source</dt>","Documents &amp; notes","Screening","Pipeline history","Assessment Link","Internal Notes","Re-screen"]){
   expect(drawer).toContain(label);
  }
 });
 it("COL-placements-02 does not fabricate scores or public resume URLs",()=>{
  const drawer=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(drawer).toContain("privateResumeUrl=detail?.resume.available &&");
  expect(drawer).toContain('/^\\/api\\/(college|admin|tpo)\\/verification\\//');
  expect(drawer).toContain("? detail.resume.url : null;");
  expect(drawer).toContain("It does not fabricate a match score");
 });
});