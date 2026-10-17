import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Super Admin CI reconciliation without weakening source contracts",()=>{
  it("SA-placements-projects-36 carries both legacy recruiter card headers and exact action copy",()=>{
    const hr=readFileSync("src/components/admin/super-admin-hr-accounts.tsx","utf8");
    const dialog=readFileSync("src/components/admin/super-admin-hr-account-dialog.tsx","utf8");
    expect(hr).toContain("Recruiter account lifecycle");
    expect(hr).toContain("Recruiter accounts");
    expect(hr).toContain("Industry access");
    expect(hr).toContain("Add recruiter");
    expect(dialog).toContain('"Add recruiter"');
  });
  it("SA-placements-projects-46 retains real Department filtering rather than an obsolete placeholder",()=>{
    const view=readFileSync("src/components/admin/super-admin-interview-operations.tsx","utf8");
    expect(view).toContain('choices("Department"');
    expect(view).toContain('departmentName??"Not recorded"');
    expect(view).toContain("Department filter uses the applicant");
  });
  it("GR-30 honors a bounded 45s guarded lock on long drive creation",()=>{
    const form=readFileSync("src/components/placements/placement-job-create-form.tsx","utf8");
    expect(form).toContain("useGuardedAction({timeoutMs:45000})");
    expect(form).toContain("await run(async()=>{");
  });
});
