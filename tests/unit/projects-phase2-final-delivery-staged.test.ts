import {describe,it,expect} from "vitest";
import {projectDeliveryAttachmentSchema,projectDeliveryLockInputSchema,mayReopenApprovedDelivery} from "@/modules/projects/pr-s2-07-delivery-reopen-model";
import {readFileSync} from "node:fs";
const proposal=readFileSync(new URL("../../docs/proposed-migrations/pr-s2-07-final-delivery.sql",import.meta.url),"utf8");
describe("PR-S2-07 final delivery proposed safe reopen",()=>{
  it("requires an explicit reason and prevents evaluated/finished reopening",()=>{
    expect(projectDeliveryLockInputSchema.safeParse({expectedUpdatedAt:"2026-10-16T00:00:00Z",reason:"Learner requested correction"}).success).toBe(true);
    expect(projectDeliveryLockInputSchema.safeParse({expectedUpdatedAt:"2026-10-16T00:00:00Z",reason:" "}).success).toBe(false);
    expect(mayReopenApprovedDelivery("ACTIVE",false)).toBe(true);
    expect(mayReopenApprovedDelivery("ACTIVE",true)).toBe(false);
    expect(mayReopenApprovedDelivery("COMPLETED",false)).toBe(false);
  });
  it("rejects attachment without its scoped pointer and stages append-only events",()=>{
    expect(projectDeliveryAttachmentSchema.safeParse({name:"Proof",kind:"FILE",fileId:null,url:null}).success).toBe(false);
    expect(proposal).toContain("FOREIGN KEY (project_id,submission_id)");
    expect(proposal).toContain("event_type IN ('LOCKED','REOPENED','ATTACHMENTS_CHANGED')");
  });
});
