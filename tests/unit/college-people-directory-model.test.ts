import { describe, expect, it } from "vitest";
import { collegePeopleDirectoryFilterSchema, collegePeopleDirectoryHref } from "@/modules/people/college-people-directory-model";
import { listCollegePeopleQuerySchema } from "@/modules/people/validation";

describe("College Admin people directory filters", () => {
  it("validates canonical role/status/search/page and disallows a caller-selected college", () => {
    expect(collegePeopleDirectoryFilterSchema.parse({})).toEqual({
      q: "", role: "ALL", status: "ALL", page: 1,
    });
    const filter = collegePeopleDirectoryFilterSchema.parse({
      q: "  a & b  ", role: "MENTOR", status: "SUSPENDED", page: "3",
    });
    expect(filter.q).toBe("a & b");
    const url = new URL(collegePeopleDirectoryHref(filter), "https://example.test");
    expect(url.pathname).toBe("/college/people");
    expect(url.searchParams.get("q")).toBe("a & b");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.has("collegeId")).toBe(false);
    for (const input of [{ collegeId: crypto.randomUUID() }, { role: "ADMIN" },
      { status: "DISABLED" }, { q: "x".repeat(101) }, { page: -1 }]) {
      expect(collegePeopleDirectoryFilterSchema.safeParse(input).success).toBe(false);
    }
  });

  it("rejects injected scope and invalid filters at the service boundary", () => {
    const collegeId = "11111111-1111-4111-8111-111111111111";
    expect(listCollegePeopleQuerySchema.safeParse({
      collegeId, role: "FACULTY", status: "ACTIVE", q: " Name ", limit: 50, offset: 0,
    }).success).toBe(true);
    expect(listCollegePeopleQuerySchema.safeParse({
      collegeId, role: "SUPER_ADMIN",
    }).success).toBe(false);
    expect(listCollegePeopleQuerySchema.safeParse({
      collegeId, otherCollegeId: collegeId,
    }).success).toBe(false);
  });
});
