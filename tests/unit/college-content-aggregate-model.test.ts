import { describe, expect, it } from "vitest";
import {
  collegeContentDuration,
  collegeContentHref,
  collegeContentPageCount,
  collegeContentScopeLabel,
  collegeContentQuerySchema,
  collegeContentSearchParams,
  collegeContentTypes,
} from "@/modules/courses/college-content-aggregate-model";

describe("College Admin content aggregate model", () => {
  it("uses distinct registered video and resource kinds", () => {
    expect(collegeContentTypes("VIDEO")).toEqual(["VIDEO", "YOUTUBE"]);
    expect(collegeContentTypes("RESOURCE")).toEqual(["RESOURCE"]);
  });

  it("rejects unscoped college overrides and invalid filters", () => {
    expect(collegeContentQuerySchema.parse({})).toEqual({
      q: "", status: "ALL", format: "ALL", scope: "ALL", visibility: "ALL", page: 1,
    });
    expect(collegeContentQuerySchema.parse({ q: "  safety  ", status: "PUBLISHED", page: "2" }))
      .toEqual({ q: "safety", status: "PUBLISHED", format: "ALL", scope: "ALL", visibility: "ALL", page: 2 });
    for (const invalid of [
      { collegeId: "another-college" },
      { status: "CLOSED" },
      { format: "EXTERNAL_URL" },
      { scope: "OTHER" },
      { visibility: "MAYBE" },
      { offeringStatus: "CANCELLED" },
      { page: 0 },
      { page: 1001 },
      { q: "a".repeat(101) },
      { courseCode: "x".repeat(65) },
      { programCode: "x".repeat(65) },
      {cohortCode:"x".repeat(65)},
      {periodCode:"x".repeat(65)},
      {pathStatus:"ACTIVE"},
    ]) {
      expect(collegeContentQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("rejects duplicate selectors and preserves special characters in links", () => {
    expect(collegeContentSearchParams({ page: ["1", "2"] })).toBeNull();
    expect(collegeContentQuerySchema.safeParse(
      collegeContentSearchParams({ status: ["DRAFT"] }),
    ).success).toBe(false);
    const href = collegeContentHref("VIDEO", { q: "a & b", courseCode: "CS-101", status: "ARCHIVED", format: "YOUTUBE", scope: "SECTION", visibility: "ALL", page: 2 });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/college/videos");
    expect(url.searchParams.get("q")).toBe("a & b");
    expect(url.searchParams.get("format")).toBe("YOUTUBE");
    expect(url.searchParams.get("courseCode")).toBe("CS-101");
    expect(url.searchParams.get("scope")).toBe("SECTION");
    expect(collegeContentHref("RESOURCE",{...collegeContentQuerySchema.parse({offeringStatus:"ARCHIVED"})}))
      .toContain("offeringStatus=ARCHIVED");
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(collegeContentHref("VIDEO",collegeContentQuerySchema.parse({pathStatus:"DRAFT"}))).toContain("pathStatus=DRAFT");
    expect(collegeContentHref("RESOURCE",collegeContentQuerySchema.parse({periodCode:"2026&FALL"}))).toContain("periodCode=2026%26FALL");
    expect(collegeContentHref("RESOURCE",collegeContentQuerySchema.parse({cohortCode:"B&2026"}))).toContain("cohortCode=B%262026");
    expect(collegeContentHref("VIDEO",collegeContentQuerySchema.parse({programCode:"B&Tech"}))).toContain("programCode=B%26Tech");
    expect(collegeContentHref("RESOURCE",collegeContentQuerySchema.parse({visibility:"HIDDEN"}))).toContain("visibility=HIDDEN");
    expect(collegeContentHref("RESOURCE", {
      q: "", status: "ALL", format: "ALL", scope: "ALL", visibility: "ALL", page: 1,
    })).toBe("/college/resources");
  });

  it("renders only observed duration and paginated record counts", () => {
    expect(collegeContentScopeLabel(null)).toBe("Shared offering");
    expect(collegeContentScopeLabel("delivery-id")).toBe("Section-specific");
    expect(collegeContentDuration(null)).toBe("Not recorded");
    expect(collegeContentDuration(90)).toBe("1:30");
    expect(collegeContentDuration(3600)).toBe("60:00");
    expect(collegeContentPageCount(0)).toBe(1);
    expect(collegeContentPageCount(26)).toBe(2);
  });
});
