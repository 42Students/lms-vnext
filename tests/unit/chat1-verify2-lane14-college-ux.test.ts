import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");

describe("lane 14 P1 verification: college placement and graduation states",()=>{
  it("G2-9-014-058 makes the Shortlisted page recoverable when placements are disabled",()=>{
    const page=source("src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx");
    expect(page).toContain("resolveOptionalModuleAccess(context)");
    expect(page).toContain("if(!modules.placements.enabled)");
    expect(page).toContain('title="Placements unavailable"');
    expect(page).toContain("Ask a Super Admin to enable Placements in Module Access");
    expect(page).toContain('href="/college"');
    expect(page).toContain('focus-visible:outline-2');
  });
  it("G2-9-002-036 shows the historic graduation message only after a confirmed write",()=>{
    const sourceText=source("src/components/academics/college-cohort-management.tsx");
    const graduateAction=sourceText.slice(sourceText.indexOf("function graduate()"),
      sourceText.indexOf("function retire()"));
    expect(graduateAction).toContain('apiFetch("/api/college/batches/"');
    expect(graduateAction).toContain("method: \"POST\"");
    expect(graduateAction).toContain("successMessage");
    expect(graduateAction).toContain('showToast({tone:"success",title:successMessage})');
    expect(graduateAction.indexOf("await apiFetch")).toBeLessThan(graduateAction.indexOf("showToast"));
    expect(graduateAction).toContain("router.refresh()");
  });
});
