import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdminProjectsQuery } from "@/modules/projects/admin-projects-query-model";

const page = () => readFileSync(
  join(process.cwd(), "src/app/(authenticated)/admin/projects/page.tsx"), "utf8",
);

describe("IIT Dharwad Projects: Super Admin URL and pagination resilience", () => {
  it("PROJ-BREAK-ux-10 preserves authorized default list semantics and legacy search aliases", () => {
    expect(parseAdminProjectsQuery({})).toMatchObject({
      success: true,
      data: { view: "table", page: 1, pageSize: 20 },
    });
    expect(parseAdminProjectsQuery({
      search: "  IIT Dharwad  ", page: "2", pageSize: "50", status: "ACTIVE", view: "cards",
    })).toMatchObject({
      success: true,
      data: { q: "IIT Dharwad", page: 2, pageSize: 50, status: "ACTIVE", view: "cards" },
    });
    expect(parseAdminProjectsQuery({ q: "learner" })).toMatchObject({
      success: true, data: { q: "learner" },
    });
  });

  it("PROJ-BREAK-ux-11 blocks corrupt pagination and hostile input before it reaches the DB", () => {
    const rejected = [
      { page: "0" }, { page: "-1" }, { page: "1.5" }, { page: "Infinity" },
      { page: "NaN" }, { page: "100001" },
      { pageSize: "0" }, { pageSize: "9" }, { pageSize: "101" },
      { pageSize: "1.1" }, { pageSize: "1e309" },
      { status: "OTHER_COLLEGE" }, { view: "javascript:alert(1)" },
      { search: "a".repeat(121) },
    ];
    for (const params of rejected) {
      expect(parseAdminProjectsQuery(params).success, JSON.stringify(params)).toBe(false);
    }
  });

  it("PROJ-BREAK-ux-12 array-valued URL params never bypass the same validation", () => {
    expect(parseAdminProjectsQuery({ page: ["Infinity", "1"] }).success).toBe(false);
    // Never select only the first value of a duplicated tenant filter:
    // a crafted second status or search token must be rejected as ambiguous.
    expect(parseAdminProjectsQuery({ status: ["ARCHIVED", "ACTIVE"] }).success).toBe(false);
    expect(parseAdminProjectsQuery({ search: ["IIT Dharwad", "other"] }).success).toBe(false);
  });

  it("PROJ-BREAK-ux-13 the admin boundary shows a safe recovery link without querying on invalid input", () => {
    const code = page();
    const guard = code.indexOf("if (!parsed.success)");
    const query = code.indexOf("listProjectAdminSnapshots(");
    expect(guard).toBeGreaterThan(-1);
    expect(query).toBeGreaterThan(guard);
    expect(code).toContain('title="Invalid project filters"');
    expect(code).toContain('href="/admin/projects"');
    expect(code).toContain('<ErrorState');
  });
});
