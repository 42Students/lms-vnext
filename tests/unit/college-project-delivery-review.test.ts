import { describe, expect, it } from "vitest";
import { adminDeliveryToast, canAdminSettleDelivery } from "@/modules/projects/admin-submission-review-model";
import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";

describe("COL-projects-14 workspace Delivery review", () => {
  it("supports Accept/Request changes only from submitted and Lock from submitted or accepted", () => {
    expect(canAdminSettleDelivery("SUBMITTED", false, "ACTIVE", "APPROVED")).toBe(true);
    expect(canAdminSettleDelivery("SUBMITTED", false, "ACTIVE", "CHANGES_REQUESTED")).toBe(true);
    expect(canAdminSettleDelivery("APPROVED", false, "ACTIVE", "LOCK")).toBe(true);
    expect(canAdminSettleDelivery("APPROVED", true, "ACTIVE", "LOCK")).toBe(false);
    expect(canAdminSettleDelivery("DRAFT", false, "ACTIVE", "APPROVED")).toBe(false);
  });
  it("retains exact legacy feedback and blocks unsafe linked evidence", () => {
    expect(adminDeliveryToast("APPROVED")).toBe("Submission accepted.");
    expect(adminDeliveryToast("LOCK")).toBe("Submission locked.");
    expect(safeProjectExternalHref("javascript:alert(1)")).toBeNull();
    expect(safeProjectExternalHref("https://example.com/demo")).toBe("https://example.com/demo");
  });
});
