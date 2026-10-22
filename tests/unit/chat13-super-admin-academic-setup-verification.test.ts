import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/** Source wiring checks for claimed main-branch fixes. PostgreSQL and browser gates remain. */
describe("Super Admin Academic Setup gap verifications", () => {
  it("SA-academics-people-16 maps courses through writable semester picker", () => {
    const code = readSource("src/app/(authenticated)/admin/semester-courses/page.tsx");
    expect(code).toContain("CollegeTermMappingManager");
    expect(code).toContain("listCollegeTermMappings");
  });
  it("SA-academics-people-17 persists staffing coverage warnings in mapping read", () => {
    const code = readSource("src/modules/academics/college-term-mapping-service.ts");
    expect(code).toContain("staffingWarning");
    expect(code).toContain("staffingTooltip");
  });
  it("SA-academics-people-19 shows legacy batch columns", () => {
    const code = readSource("src/app/(authenticated)/admin/batches/page.tsx");
    expect(code).toContain('header:"Years"');
    expect(code).toContain("row.startDate?.slice(0,4)");
    expect(code).toContain("row.endDate?.slice(0,4)");
    expect(code).toContain("Academic Year");
    expect(code).toContain("Semester");
    expect(code).toContain("Students");
    expect(code).toContain("Status");
  });
  it("SA-academics-people-20 opens batch roster with capacity scoped actions", () => {
    const code = readSource("src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx");
    expect(code).toContain("getSuperAdminBatchRosterOverview");
    expect(code).toContain("<DataTable");
    expect(code).toContain("Manage roster and schedule");
  });
  it("SA-academics-people-22 mounts class create edit schedule", () => {
    const code = readSource("src/app/(authenticated)/admin/classes/page.tsx");
    expect(code).toContain("CollegeClassCreate");
    expect(code).toContain("CollegeClassRowActions");
    expect(code).toContain("Schedule →");
  });
  it("SA-academics-people-29 mounts electives slot and offering actions", () => {
    const code = readSource("src/app/(authenticated)/admin/electives/page.tsx");
    expect(code).toContain("CollegeSlotManager");
    expect(code).toContain("CollegeElectiveOfferingManager");
    expect(code).toContain("CollegeElectiveLifecycleAction");
  });
  it("SA-academics-people-38 adds workspace entry to academic setup strip", () => {
    const code = readSource("src/components/admin/academic-setup-steps.tsx");
    expect(code).toContain("/admin/academics");
    expect(code).toContain("Academic Setup overview");
  });
  it("SA-academics-people-R02 accepts explicit scoped superadmin permission", () => {
    const code = readSource("src/modules/academics/college-term-mapping-service.ts");
    expect(code).toContain("resolveActingCollege(context, \"academics.manage\")");
  });
  it("SA-academics-people-01 renders six-step academic sequence", () => {
    const code = readSource("src/components/admin/academic-setup-steps.tsx");
    expect(code).toContain("<StepIndicator current={step} total={steps.length}");
    expect(code).toContain("Previous:");
    expect(code).toContain("Next:");
  });
  it("SA-academics-people-11 projects dependent semester batch class counts", () => {
    const code = readSource("src/app/(authenticated)/admin/programs/page.tsx");
    expect(code).toContain("listProgramContents");
    expect(code).toContain("contents: contents.get");
  });
  it("SA-academics-people-15 filters semester courses and credits", () => {
    const code = readSource("src/app/(authenticated)/admin/semesters/page.tsx");
    expect(code).toContain("name=\"programId\"");
    expect(code).toContain("Courses");
    expect(code).toContain("Credits");
  });
  it("SA-academics-people-21 filters batches by program and legacy state", () => {
    const code = readSource("src/app/(authenticated)/admin/batches/page.tsx");
    expect(code).toContain("name=\"programId\"");
    expect(code).toContain("name=\"status\"");
    expect(code).toContain("Inactive (planned / archived)");
  });
  it("SA-academics-people-23 projects class description capacity and filters", () => {
    const code = readSource("src/app/(authenticated)/admin/classes/page.tsx");
    expect(code).toContain('selectedProgramId={data.query.programId??""}');
    expect(code).toContain('selectedCohortCode={data.query.cohortCode??""}');
    expect(code).toContain("Max Students");
    expect(code).toContain("Description");
    expect(code).toContain("Students");
  });
  it("SA-academics-people-25 lists batch promotion candidates", () => {
    const code = readSource("src/app/(authenticated)/admin/batch-promotion/page.tsx");
    expect(code).toContain("Batch promotion queue");
    expect(code).toContain("Academic Year");
    expect(code).toContain("Students");
    expect(code).toContain("Semester");
    expect(code).toContain("visibleCohorts.map");
  });
  it("SA-academics-people-30 filters elective program and semester", () => {
    const code = readSource("src/app/(authenticated)/admin/electives/page.tsx");
    expect(code).toContain("name=\"programId\"");
    expect(code).toContain("name=\"semesterNumber\"");
    expect(code).toContain("Students");
  });
  it("SA-academics-people-10 provides adjustable department paging", () => {
    const code = readSource("src/components/admin/department-directory.tsx");
    expect(code).toContain("department-directory-page-size");
    expect(code).toContain("setPageSize");
    expect(code).toContain("Search departments");
  });
  it("SA-academics-people-35 live searchable directories and adjustable pages", () => {
    const code = readSource("src/components/admin/admin-scoped-read-page.tsx");
    expect(code).toContain("AdminScopedLiveSearch");
    expect(code).toContain("pageSize");
    expect(code).toContain("Refresh directory");
  });
  it("SA-academics-people-40 announces updated directory results", () => {
    const code = readSource("src/components/admin/department-directory.tsx");
    expect(code).toContain("role=\"status\"");
    expect(code).toContain("aria-live=\"polite\"");
  });
  it("SA-academics-people-42 refreshes scoped directories", () => {
    const code = readSource("src/components/admin/admin-scoped-read-page.tsx");
    expect(code).toContain("aria-label=\"Refresh directory\"");
    expect(code).toContain("Refresh");
  });
  it("SA-academics-people-45 includes historical batches on demand", () => {
    const code = readSource("src/app/(authenticated)/admin/batch-promotion/page.tsx");
    expect(code).toContain("Show completed / inactive");
    expect(code).toContain("showCompleted");
  });
});
