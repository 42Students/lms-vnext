import { describe, expect, it } from "vitest";
import { FriendlyFetchError } from "@/lib/api-fetch";
import { tpoDriveFormErrorMessage } from "@/modules/placements/tpo-drive-form-error-copy";

describe("TPO drive form errors", () => {
  it("TPO-drives-44 maps publish, edit and setup failures to useful legacy-style sentences", () => {
    const cases = [
      ["PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND", "Pick the company from the list before continuing."],
      ["PLACEMENT_SEASON_NOT_ACTIVE", "The placement season is not active."],
      ["PLACEMENT_JOB_INVALID_DEADLINE", "Set a future application deadline before publishing."],
      ["PLACEMENT_JOB_EXTERNAL_URL_REQUIRED", "Add a valid HTTPS employer application link before publishing."],
      ["PLACEMENT_JOB_INVALID_CTC_RANGE", "Maximum CTC must be greater than or equal to minimum CTC."],
      ["PLACEMENT_ROLE_OPTION_REQUIRED", "Add at least one role before publishing."],
      ["PLACEMENT_JOB_STALE", "This drive changed while you were working. Refresh and try again."],
      ["PLACEMENT_JOB_NOT_EDITABLE", "This drive can no longer be edited."],
      ["PLACEMENT_ROUND_STALE", "A round changed while you were working. Refresh and try again."],
    ] as const;
    for (const [code, text] of cases) {
      expect(tpoDriveFormErrorMessage(new FriendlyFetchError("Generic failure", 409, code))).toBe(text);
    }
  });

  it("TPO-drives-R05 surfaces recognized offending fields, never raw Zod messages", () => {
    const result = tpoDriveFormErrorMessage(new FriendlyFetchError(
      "Please check the highlighted fields and try again.", 400, "INVALID_REQUEST", null,
      { minCgpa: "PRIVATE_DB_QUERY_INTERNAL_ERROR" },
    ));
    expect(result).toBe("Check minimum CGPA and try again.");
    expect(result).not.toContain("PRIVATE_DB_QUERY_INTERNAL_ERROR");
    expect(tpoDriveFormErrorMessage(new FriendlyFetchError(
      "Please check the highlighted fields and try again.", 400, "INVALID_REQUEST", null,
      { userPassword: "SECRET_UNTRUSTED_TEXT" },
    ))).not.toContain("SECRET_UNTRUSTED_TEXT");
  });

  it("TPO-drives-44 unknown short machine codes are never displayed from typed API errors", () => {
    expect(tpoDriveFormErrorMessage(new FriendlyFetchError("DATABASE_CONSTRAINT_FAILED", 500, "UNKNOWN_CODE")))
      .toBe("We could not save this drive. Check your drafts and try again.");
  });

  it("TPO-drives-44 never exposes an unknown machine code or lengthy untrusted message", () => {
    expect(tpoDriveFormErrorMessage(new Error("INTERNAL_SQL_FAILED"))).toBe(
      "We could not save this drive. Check your drafts and try again.",
    );
    expect(tpoDriveFormErrorMessage(new Error("x".repeat(300)))).toBe(
      "We could not save this drive. Check your drafts and try again.",
    );
    expect(tpoDriveFormErrorMessage(new FriendlyFetchError(
      "This changed while you were working. Refresh and try again.", 409, "UNMAPPED_BACKEND_CODE",
    ))).not.toContain("UNMAPPED_BACKEND_CODE");
  });
});
