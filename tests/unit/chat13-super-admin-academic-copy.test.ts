import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {legacyAcademicStatus} from "@/modules/academics/legacy-academic-status";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Academic Setup legacy copy and defaults",()=>{
 it("SA-academics-people-06 confirms department creation with exact legacy success and accessible feedback",()=>{
  const form=read("src/components/admin/department-create-form.tsx");
  expect(form).toContain("Created department “");
  expect(form).toContain("Next, add programs or courses under it.");
  expect(form).toContain('role="status"');
  expect(form).toContain("setName(\"\")");
 });
 it("SA-academics-people-28 creates a 50-seat lecture hall with legacy labels and field defaults",()=>{
  const manager=read("src/components/admin/lecture-hall-manager.tsx");
  const copy=read("src/modules/academics/lecture-hall-copy.ts");
  expect(manager).toContain('capacity: "50"');
  expect(manager).toContain('roomType: ""');
  expect(manager).toContain('if (!values.roomType) return setError("Select a room type")');
  expect(copy).toContain("Create New Lecture Hall / Room");
  expect(copy).toContain("Lecture hall created successfully!");
  expect(copy).toContain("Laboratory");
 });
 it("SA-academics-people-36 formats persisted status enums as legacy-readable names",()=>{
  expect(legacyAcademicStatus("ACTIVE")).toBe("Active");
  expect(legacyAcademicStatus("PLANNED",true)).toBe("Inactive");
  expect(legacyAcademicStatus("ARCHIVED",true)).toBe("Inactive");
  expect(legacyAcademicStatus("COMPLETED",true)).toBe("Completed");
  const rows=read("src/app/(authenticated)/admin/batches/page.tsx");
  expect(rows).toMatch(/legacyAcademicStatus\(row\.status,\s*true\)/);
  expect(read("src/app/(authenticated)/admin/electives/page.tsx")).toContain("legacyAcademicStatus(item.status)");
  const overview=read("src/components/academics/academics-overview.tsx");
  expect(overview).toMatch(/legacyAcademicStatus\(cohort\.status,\s*true\)/);
  expect(overview).toContain("legacyAcademicStatus(period.status)");
 });
 it("SA-academics-people-37 restores legacy department and lecture-hall empty list copy",()=>{
  expect(read("src/components/admin/department-directory.tsx")).toContain("No departments found. Create a department to get started.");
  expect(read("src/components/admin/lecture-hall-manager.tsx")).toContain("No lecture halls found.");
  expect(read("src/app/(authenticated)/admin/lecture-halls/page.tsx")).toContain("No lecture halls found.");
 });
});
