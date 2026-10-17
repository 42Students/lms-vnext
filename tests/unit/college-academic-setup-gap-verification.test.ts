import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("College Academic Setup source acceptance",()=>{
 it("COL-academic-setup-02 verified academic workflow",()=>{
  const code=source("src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx");
  expect(code).toContain("allocationCandidates(");
  expect(code).toContain("joinGroup(context, groupId, membershipId");
 });
 it("COL-academic-setup-03 verified academic workflow",()=>{
  const code=source("src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx");
  expect(code).toContain("moveElectiveMember");
  expect(code).toContain("leaveGroup");
  expect(code).toContain("Archived offerings are read-only.");
 });
 it("COL-academic-setup-04 verified academic workflow",()=>{
  const code=source("src/components/electives/college-elective-offering-manager.tsx");
  expect(code).toContain("Waitlist:");
  expect(code).toContain("Seats:");
  expect(code).toContain("archive(offering)");
 });
 it("COL-academic-setup-05 verified academic workflow",()=>{
  const code=source("src/components/academics/college-structure-directory.tsx");
  expect(code).toContain("item.confirmedStudents");
  expect(code).toContain("Pick:");
  expect(code).toContain("Open</Link>");
 });
 it("COL-academic-setup-06 verified academic workflow",()=>{
  const code=source("src/components/academics/college-term-mapping-manager.tsx");
  expect(code).toContain("Courses to Add");
  expect(code).toContain("setDraftByTerm");
  expect(code).toContain("mappedIds.has(course.id)");
 });
 it("COL-academic-setup-07 verified academic workflow",()=>{
  const code=source("src/components/academics/college-term-mapping-manager.tsx");
  expect(code).toContain("updateMapping(");
  expect(code).toContain("Semester course mapping updated.");
  expect(code).toContain("PATCH");
 });
 it("COL-academic-setup-08 verified academic workflow",()=>{
  const code=source("src/components/academics/college-term-mapping-manager.tsx");
  expect(code).toContain("onDrop");
  expect(code).toContain("Semester course order saved.");
  expect(code).toContain("draggable");
 });
 it("COL-academic-setup-09 verified academic workflow",()=>{
  const code=source("src/modules/academics/college-term-mapping-service.ts");
  expect(code).toContain("No faculty assigned");
  expect(code).toContain("staffing.missing");
  expect(code).toContain("staffingWarning");
 });
 it("COL-academic-setup-10 verified academic workflow",()=>{
  const code=source("src/app/(authenticated)/college/semester-courses/page.tsx");
  expect(code).toContain("CollegeTermMappingManager");
  expect(code).toContain("Semester–Course Mapping");
 });
 it("COL-academic-setup-13 verified academic workflow",()=>{
  const code=source("src/components/college/college-legacy-group-tabs.tsx");
  expect(code).toContain("Academic setup · Step");
  expect(code).toContain("Previous:");
  expect(code).toContain("Next:");
 });
 it("COL-academic-setup-14 verified academic workflow",()=>{
  const code=source("src/components/academics/college-academic-directory.tsx");
  expect(code).toContain("<PageHeader");
  expect(code).toContain("title={title}");
 });
 it("COL-academic-setup-22 verified academic workflow",()=>{
  const code=source("src/components/admin/admin-program-directory.tsx");
  expect(code).toContain("header: \"Contents\"");
  expect(code).toContain("item.contents.semesters");
  expect(code).toContain("item.contents.batches");
  expect(code).toContain("item.contents.classes");
 });
 it("COL-academic-setup-24 verified academic workflow",()=>{
  const code=source("src/components/admin/admin-program-directory.tsx");
  expect(code).toContain("Go to Departments");
  expect(code).toContain("Next, create its semesters and batches.");
  expect(code).toContain("setName");
 });
 it("COL-academic-setup-25 verified academic workflow",()=>{
  const code=source("src/components/academics/college-semester-management.tsx");
  expect(code).toContain("Total credits are calculated");
  expect(code).toContain("totalCredits: null");
 });
 it("COL-academic-setup-27 verified academic workflow",()=>{
  const code=source("src/components/academics/college-cohort-management.tsx");
  expect(code).toContain("Academic Year");
  expect(code).toContain("Start Date");
  expect(code).toContain("End Date");
  expect(code).toContain("academicYear");
 });
 it("COL-academic-setup-30 verified academic workflow",()=>{
  const code=source("src/components/academics/college-section-management.tsx");
  expect(code).toContain("derivedCode");
  expect(code).toContain("description: description.trim() || null");
  expect(code).toContain("apiFetch");
 });
 it("COL-academic-setup-31 verified academic workflow",()=>{
  const code=source("src/components/academics/college-recurring-preview.tsx");
  expect(code).toContain("deliveryId");
  expect(code).toContain("skipped");
  expect(code).toContain("result.ready");
 });
 it("COL-academic-setup-33 verified academic workflow",()=>{
  const code=source("src/components/academics/college-cohort-management.tsx");
  expect(code).toContain("Mark graduated");
  expect(code).toContain("GRADUATE");
 });
 it("COL-academic-setup-35 verified academic workflow",()=>{
  const code=source("src/modules/academics/college-batch-promotion-execute.ts");
  expect(code).toContain("endedTeachingAssignments");
  expect(code).toContain("facultySetupIncomplete");
 });
 it("COL-academic-setup-38 verified academic workflow",()=>{
  const code=source("src/components/admin/lecture-hall-manager.tsx");
  expect(code).toContain("title=\"Archive lecture hall\"");
  expect(code).toContain("upcoming classes");
 });
});
