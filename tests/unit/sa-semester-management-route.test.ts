import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SA-academics-people-14 semester admin workspace", () => {
  it("mounts the existing create, edit and delete controls on the Super Admin page", () => {
    const page = readFileSync("src/app/(authenticated)/admin/semesters/page.tsx", "utf8");
    expect(page).toContain("<CollegeSemesterCreateForm");
    expect(page).toContain("<CollegeSemesterRowActions");
    expect(page).toMatch(/listCollegeSemesters\(context,\s*parsed\.data\)/);
    expect(page).not.toContain("This is read-only");
  });
  it("requires the selected college from persisted tenant-scoped authorization", () => {
    const service = readFileSync("src/modules/academics/semester-mutation-service.ts", "utf8");
    const read = readFileSync("src/modules/academics/college-academic-directory-service.ts", "utf8");
    expect(service).toContain('resolveActingCollege(context, "academics.manage")');
    expect(read).toContain('resolveActingCollege(context, "academics.read")');
  });
});
