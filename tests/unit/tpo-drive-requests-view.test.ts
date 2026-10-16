import {describe,expect,it} from "vitest";
import {tpoDriveLifecycleQuerySchema,driveRequestStatusLabel,TPO_REQUESTS_COPY} from "@/modules/placements/tpo-drive-lifecycle-list-model";
describe("TPO-drives-02 TPO-requests-verification-33 requests tab",()=>{
  it("parses request view and rejects unknown states",()=>{
    expect(tpoDriveLifecycleQuerySchema.parse({view:"REQUESTS"}).view).toBe("REQUESTS");
    expect(tpoDriveLifecycleQuerySchema.safeParse({view:"REJECTED"}).success).toBe(false);
  });
  it("uses the legacy request terms, with a no-migration fallback",()=>{
    expect(driveRequestStatusLabel("REQUEST")).toBe("Needs your review");
    expect(driveRequestStatusLabel("SENT_BACK")).toBe("Sent back");
    expect(TPO_REQUESTS_COPY.unavailable).toContain("not available");
  });
});
