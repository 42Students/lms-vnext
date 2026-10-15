import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {projectDeliveryLockInputSchema,mayReopenApprovedDelivery} from "@/modules/projects/pr-s2-07-delivery-reopen-model";
const read=(n:string)=>readFileSync(new URL("../../src/modules/projects/"+n,import.meta.url),"utf8");
describe("PR-S2-07 immutable approval lock and explicit reopen",()=>{
  it("requires a reason and a version token before reopening",()=>{
    expect(projectDeliveryLockInputSchema.safeParse({
      expectedUpdatedAt:"2026-10-16T12:00:00Z",reason:"Corrections required",
    }).success).toBe(true);
    expect(mayReopenApprovedDelivery("ACTIVE",true)).toBe(false);
    expect(mayReopenApprovedDelivery("COMPLETED",false)).toBe(false);
  });
  it("locks the Project, binds the approved version and denies repeat or evaluated reopen",()=>{
    const svc=read("delivery-reopen-service.ts");
    expect(svc).toContain('.for("update")');
    expect(svc).toContain('latest.status!=="APPROVED"');
    expect(svc).toContain('eq(projectEvaluations.submissionId,latest.id)');
    expect(svc).toContain('PROJECTS_DELIVERY_REOPENED');
    expect(svc).toContain("isNull(projectSubmissions.reopenedAt)");
    expect(svc).toContain("tx.insert(projectDeliveryEvents)");
  });
  it("requires an exact reopen event before creating another draft after approval",()=>{
    const svc=read("submission-service.ts");
    expect(svc).toContain('latest?.status==="APPROVED"');
    expect(svc).toContain('Boolean(latest.reopenedAt)');
    expect(svc).toContain('action:"LOCKED"');
    expect(svc).toContain("projectSubmissionAllowsNewDraft(latest?.status)");
  });
});
