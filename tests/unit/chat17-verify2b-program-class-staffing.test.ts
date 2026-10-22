import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("legacy semester-class staffing independent of deliveries",()=>{
 it("keeps program-class roster and faculty-grant coverage separate from active-delivery warning",()=>{
  const service=source("src/modules/academics/college-term-mapping-service.ts");
  expect(service).toContain("export async function getCollegeTermStaffingReport(");
  expect(service).toContain("eq(cohorts.programId,details.term.programId)");
  expect(service).toContain("inArray(courseSectionDeliveries.sectionId,sectionIds)");
  expect(service).toContain("isNull(courseTeachingAssignments.deletedAt)");
  expect(service).toContain("courseId+\":\"+section.id");
  expect(service).toContain('source:"PROGRAM_CLASSES_WITH_ACTIVE_COURSE_TEACHING_ASSIGNMENTS"');
  expect(service).toContain('staffingSource: "ACTIVE_DELIVERIES" as const');
  expect(service).toContain("historicalClassCount:");
 });
 it("keeps route authenticated, read-only, no-store, and selected semester report accessible",()=>{
  const route=source("src/app/api/academics/semesters/[semesterId]/staffing/route.ts");
  expect(route).toContain("getCurrentRequestContext()");
  expect(route).toContain("getCollegeTermStaffingReport(");
  expect(route).toContain('"Cache-Control":"private, no-store"');
  const manager=source("src/components/academics/college-term-mapping-manager.tsx");
  expect(manager).toContain("<CollegeTermStaffingReport termId={termId}/>");
  const component=source("src/components/academics/college-term-staffing-report.tsx");
  expect(component).toContain('role="alert"');
  expect(component).toContain("Retry staffing report");
  expect(component).toContain("No courses mapped to this semester.");
 });
});
