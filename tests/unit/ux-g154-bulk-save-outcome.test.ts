import { describe, expect, it } from "vitest";
import { templateCollegeBulkFailureNotice } from "@/modules/projects/template-college-bulk-notice";

describe("UX-G154 template bulk assignment failure recovery", () => {
  it("does not claim a failed read submitted any changes", () => {
    const notice = templateCollegeBulkFailureNotice(new Error("Could not load assignments"), false);
    expect(notice).toContain("Could not load assignments");
    expect(notice).toContain("No save request was sent");
    expect(notice).toContain("Refresh assignments");
  });

  it("never promises rollback after a PUT with an uncertain response", () => {
    const notice = templateCollegeBulkFailureNotice(new Error("Connection lost"), true);
    expect(notice).toContain("save request was sent");
    expect(notice).toContain("result could not be confirmed");
    expect(notice).toContain("check the current state before retrying");
    expect(notice).not.toContain("No partial changes were saved");
  });

  it("keeps guidance usable for unexpected failures", () => {
    const notice = templateCollegeBulkFailureNotice(null, true);
    expect(notice).toContain("College assignments could not be updated");
    expect(notice).toContain("Refresh assignments");
  });
});
