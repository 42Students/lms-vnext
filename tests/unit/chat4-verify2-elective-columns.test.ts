import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { summarizeAdminElectives, type AdminElectiveRow } from "@/modules/electives/admin-directory-model";

const page = readFileSync("src/app/(authenticated)/admin/electives/page.tsx", "utf8");

describe("W1 G2-10-006-007 legacy elective slot table", () => {
  it("shows the ten legacy columns in order and uses the persisted page-scoped count fields", () => {
    const expected = ["Slot", "Program", "Sem", "Year", "Credits", "Pick",
      "Offerings", "Students", "Status", "Actions"];
    const header = page.slice(page.indexOf('<thead><tr>'), page.indexOf('</thead>'));
    expect(header).toContain('<span className="sr-only">Actions</span>');
    for (let i = 0; i < expected.length - 1; i += 1) {
      const current = '<th scope="col">' + expected[i] + '</th>';
      expect(header).toContain(current);
      if (i > 0) expect(header.indexOf(current)).toBeGreaterThan(
        header.indexOf('<th scope="col">' + expected[i - 1] + '</th>'));
    }
    expect(page).toContain('href={link(current,item.id)}');
    expect(page).toContain('item.academicYear??"—"');
    expect(page).toContain('item.offerings??0');
    expect(page).toContain('item.students??0');
    expect(page).toContain('CollegeElectiveLifecycleAction');
  });

  it("retains zero and nonzero offering/student counts without creating fake counts", () => {
    const row: AdminElectiveRow = {
      id: "slot-1", name: "Professional Elective 1", programId: "program-1",
      programName: "Computer Science", semesterNumber: 5, academicYear: "2026-27",
      description: null, version: 1, credits: 3, minPick: 1, maxPick: 2,
      status: "ACTIVE", offerings: 4, students: 19,
    };
    const result = summarizeAdminElectives([row, { ...row, id: "slot-2", status: "ARCHIVED",
      offerings: 0, students: 0 }]);
    expect(result.items.map(item => [item.offerings, item.students])).toEqual([[4, 19], [0, 0]]);
    expect(result.active).toBe(1);
    expect(result.archived).toBe(1);
  });
});
