import { describe, expect, it } from "vitest";
import { adminUserDirectoryPaging, adminUsersHref, adminUsersQuerySchema } from "@/modules/people/admin-user-directory-model";
describe("Super Admin membership directory paging", () => {
  it("clamps obsolete bookmarks and never renders an empty later page for an empty result", () => {
    expect(adminUserDirectoryPaging(31, 999)).toEqual({ total: 31, totalPages: 2, page: 2, offset: 30 });
    expect(adminUserDirectoryPaging(0, 999)).toEqual({ total: 0, totalPages: 1, page: 1, offset: 0 });
  });
  it("can navigate the planned 200,000 memberships without a 30,000-row ceiling", () => {
    expect(adminUserDirectoryPaging(200000, 90000)).toEqual({ total: 200000, totalPages: 6667, page: 6667, offset: 199980 });
    expect(adminUsersQuerySchema.safeParse({ page: 6667 }).success).toBe(true);
    expect(adminUsersQuerySchema.safeParse({ page: 100001 }).success).toBe(false);
    const query = adminUsersQuerySchema.parse({ tab: "FACULTY", q: "Name", platformStatus: "DISABLED", page: 6667 });
    expect(adminUsersHref(query)).toContain("tab=FACULTY");
    expect(adminUsersHref(query)).toContain("page=6667");
    expect(adminUsersHref(query)).toContain("platformStatus=DISABLED");
  });
});
