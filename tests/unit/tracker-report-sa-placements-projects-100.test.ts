import { describe, expect, it } from "vitest";
import {
  ISSUE_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  REPORTER_OPTIONS,
} from "@/modules/bug-tracker/report-form-options";
import { trackerReportSchema } from "@/modules/bug-tracker/report-input-model";

const valid = {
  reporterName: "Akhila",
  accountRole: "LEARNER",
  environment: "UAT",
  page: "Projects",
  screen: "Workspaces",
  section: "Members",
  issueType: "Wrong Data",
  severity: "MAJOR",
  description: "The wrong team member appears on this workspace",
  evidenceLink: null,
};

describe("SA-placements-projects-100 report intake contract", () => {
  it("keeps the legacy reporter, page and issue taxonomies", () => {
    expect(REPORTER_OPTIONS.map(option => option.label)).toEqual([
      "Akhila", "Himaja", "Mounika", "Sadwik", "Phanindra",
    ]);
    expect(LOCATION_OPTIONS).toHaveLength(16);
    expect(LOCATION_OPTIONS.find(option => option.value === "Projects")?.children
      ?.find(option => option.value === "Workspaces")?.children
      ?.map(option => option.value)).toContain("Members");
    expect(ISSUE_TYPE_OPTIONS.map(option => option.value)).toContain("Crash / Error");
    expect(ISSUE_TYPE_OPTIONS.map(option => option.value)).toContain("Text / Spelling");
  });

  it("accepts legacy report inputs and strips surrounding description spaces", () => {
    expect(trackerReportSchema.parse({
      ...valid, description: "  Wrong data  ",
    }).description).toBe("Wrong data");
  });

  it("rejects spoofed actor fields, invalid location and unknown type", () => {
    for (const candidate of [
      { ...valid, actorUserId: "someone-else" },
      { ...valid, page: "Hidden engineering notes" },
      { ...valid, screen: "Templates", section: "Members" },
      { ...valid, section: "Not a workspace section" },
      { ...valid, issueType: "User-supplied arbitrary type" },
      { ...valid, evidenceLink: "javascript:alert(1)" },
    ]) {
      expect(trackerReportSchema.safeParse(candidate).success).toBe(false);
    }
  });

  it("accepts any nonblank authenticated reporter display name at the shape boundary", () => {
    // The transactional service checks equality to the ACTIVE persisted user;
    // the legacy fixed-name picker is not a trusted authentication source.
    expect(trackerReportSchema.safeParse({ ...valid, reporterName: "Seed Super Admin" }).success).toBe(true);
    expect(trackerReportSchema.safeParse({ ...valid, reporterName: " " }).success).toBe(false);
    expect(trackerReportSchema.safeParse({ ...valid, reporterName: "x".repeat(121) }).success).toBe(false);
  });

  it("preserves exact validation messages", () => {
    const empty = trackerReportSchema.safeParse({ ...valid, description: " " });
    const long = trackerReportSchema.safeParse({ ...valid, description: "a".repeat(4001) });
    expect(empty.success).toBe(false);
    expect(long.success).toBe(false);
    if (empty.success || long.success) throw new Error("Expected invalid descriptions");
    expect(empty.error.issues[0]?.message).toBe("Describe what went wrong.");
    expect(long.error.issues[0]?.message).toBe("Keep the description under 4000 characters.");
  });
});
