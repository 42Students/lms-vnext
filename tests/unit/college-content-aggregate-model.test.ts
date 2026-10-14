import { describe, expect, it } from "vitest";
import {
  collegeContentDuration,
  collegeContentHref,
  collegeContentPageCount,
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
      q: "", status: "ALL", format: "ALL", page: 1,
    });
    expect(collegeContentQuerySchema.parse({ q: "  safety  ", status: "PUBLISHED", page: "2" }))
      .toEqual({ q: "safety", status: "PUBLISHED", format: "ALL", page: 2 });
    for (const invalid of [
      { collegeId: "another-college" },
      { status: "CLOSED" },
      { format: "EXTERNAL_URL" },
      { page: 0 },
      { page: 1001 },
      { q: "a".repeat(101) },
    ]) {
      expect(collegeContentQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("rejects duplicate selectors and preserves special characters in links", () => {
    expect(collegeContentSearchParams({ page: ["1", "2"] })).toBeNull();
    expect(collegeContentQuerySchema.safeParse(
      collegeContentSearchParams({ status: ["DRAFT"] }),
    ).success).toBe(false);
    const href = collegeContentHref("VIDEO", { q: "a & b", status: "ARCHIVED", format: "YOUTUBE", page: 2 });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/college/videos");
    expect(url.searchParams.get("q")).toBe("a & b");
    expect(url.searchParams.get("format")).toBe("YOUTUBE");
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(collegeContentHref("RESOURCE", {
      q: "", status: "ALL", format: "ALL", page: 1,
    })).toBe("/college/resources");
  });

  it("renders only observed duration and paginated record counts", () => {
    expect(collegeContentDuration(null)).toBe("Not recorded");
    expect(collegeContentDuration(90)).toBe("1:30");
    expect(collegeContentDuration(3600)).toBe("60:00");
    expect(collegeContentPageCount(0)).toBe(1);
    expect(collegeContentPageCount(26)).toBe(2);
  });
});
