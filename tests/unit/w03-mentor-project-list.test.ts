import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const page = readFileSync(
  join(root, "src/app/(authenticated)/mentor/projects/page.tsx"),
  "utf8",
);
const controls = readFileSync(
  join(root, "src/components/projects/project-participant-list-controls.tsx"),
  "utf8",
);
const list = readFileSync(
  join(root, "src/components/projects/project-list.tsx"),
  "utf8",
);

describe("W03 mentor project list legacy discovery contract", () => {
  it("supports addressable search, status, attention and pagination", () => {
    expect(page).toContain("searchParams");
    expect(page).toContain("params.search");
    expect(page).toContain("params.status");
    expect(page).toContain("params.attention");
    expect(page).toContain("params.page");
    expect(page).toContain("params.pageSize");
    expect(controls).toContain('name="search"');
    expect(controls).toContain('name="status"');
    expect(controls).toContain('name="attention"');
  });

  it("uses the tenant-scoped mentor attention service for review/stalled/meeting badges", () => {
    expect(page).toContain("listMyMentorProjectAttention");
    for (const label of [
      "Needs review",
      "Stalled",
      "Meeting request",
      "Meeting soon",
    ]) {
      expect(page).toContain(label);
    }
    expect(list).toContain("item.attention");
  });

  it("deep-links review and meeting attention into the relevant project tab", () => {
    expect(page).toContain('? "delivery"');
    expect(page).toContain('? "team"');
    expect(list).toContain("item.href ??");
  });

  it("does not fake the missing legacy blocker filter", () => {
    expect(page).toContain("does not yet persist the workspace blocker field");
  });
});
