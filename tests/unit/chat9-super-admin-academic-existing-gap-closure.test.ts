import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {validLegacyProgramYears,deriveSuperAdminProgramCode} from "@/modules/admin-ui/super-admin-program-input";
import {legacyAcademicStatus} from "@/modules/academics/legacy-academic-status";
import {LECTURE_HALL_COPY,ROOM_TYPE_LABELS} from "@/modules/academics/lecture-hall-copy";
import {SEMESTER_COPY} from "@/modules/academics/semester-copy";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Academic Setup gap reconciliation",()=>{
 it("SA-academics-people-06 retains exact create-department form labels and next-step success",()=>{
  const form=src("src/components/admin/department-create-form.tsx");
  const model=src("src/modules/admin-ui/department-copy.ts");
  for(const text of ["Create New Department","Department Name","Create Department","e.g., Computer Science & Engineering"])
   expect(model).toContain(text);
  expect(form).toContain('Created department “');
  expect(form).toContain("Next, add programs or courses under it.");
 });
 it("SA-academics-people-07 rejects missing or oversized department names without raw server codes",()=>{
  const form=src("src/components/admin/department-create-form.tsx");
  expect(form).toContain("Please enter department name");
  expect(form).toContain("Department name must be 255 characters or less");
  expect(form).toContain("Department was not created.");
  expect(form).toContain("maxLength={255}");
  expect(form).not.toContain("setError(payload.error)");
 });
 it("SA-academics-people-08 blocks dependency-unsafe department deletion before the request",()=>{
  const code=src("src/components/admin/department-actions.tsx");
  expect(code).toContain("hasDependencies");
  expect(code).toContain("usage.programs + usage.courses + usage.faculty");
  expect(code).toContain("Move or remove its programs, courses, faculty before deleting.");
  expect(code).toContain("disabled={pending || hasDependencies}");
  expect(code).toContain("Retry delete");
 });
 it("SA-academics-people-09 confirms discarding unsaved department rename edits",()=>{
  const code=src("src/components/admin/department-actions.tsx");
  expect(code).toContain('title="Discard department changes?"');
  expect(code).toContain("setDiscardOpen(true)");
 });
 it("SA-academics-people-12 allows a scope-controlled program department move instead of enforcing immutability",()=>{
  const actions=src("src/components/academics/academics-actions.tsx");
  const model=src("src/modules/academics/college-program-mutation-model.ts");
  expect(actions).toContain("setDepartmentId");
  expect(actions).toContain("<Select value={departmentId}");
  expect(actions).toContain("updateCollegeProgramSchema.parse");
  expect(model).toContain("departmentId: z.string().uuid().optional()");
 });
 it("SA-academics-people-13 restores program creation copy and links to scoped Departments",()=>{
  const directory=src("src/components/admin/admin-program-directory.tsx");
  for(const token of ["Create New Program","Existing Programs","Created program “","Next, create its semesters and batches.","Go to Departments","Duration (Years)",'href="/admin/departments"'])
   expect(directory).toContain(token);
 });
 it("SA-academics-people-18 offers batch creation and lifecycle directly under the Academic Setup Batches tab",()=>{
  const page=src("src/app/(authenticated)/admin/batches/page.tsx");
  expect(page).toContain("<CollegeCohortCreateForm");
  expect(page).toContain("<CollegeCohortRowActions");
  expect(page).toContain("<AcademicSetupSteps step={5}");
 });
 it("SA-academics-people-28 uses exact legacy lecture hall labels, room types, placeholders and 50-capacity default",()=>{
  const copy=src("src/modules/academics/lecture-hall-copy.ts");
  for(const v of ["Create New Lecture Hall / Room","Room Name","Room Type","Department (Optional)","e.g., Room 101, Lab A","e.g., AC room, projector available","Lecture hall created successfully!"])
   expect(copy).toContain(v);
  expect(ROOM_TYPE_LABELS.LAB).toBe("Laboratory");
  expect(ROOM_TYPE_LABELS.CONFERENCE_ROOM).toBe("Conference Room");
  expect(LECTURE_HALL_COPY.nameLabel).toBe("Room Name");
 });
 it("SA-academics-people-33 exposes live semester Active/Inactive mutation and required promotion help",()=>{
  const actions=src("src/components/academics/college-semester-management.tsx");
  expect(actions).toContain("updateCollegeSemesterSchema");
  expect(actions).toContain("isActive");
  expect(actions).toContain("SEMESTER_COPY.promotionNote");
  expect(SEMESTER_COPY.promotionNote).toBe("Batches can only be promoted into an active semester.");
 });
 it("SA-academics-people-36 renders readable Active, Inactive and Completed academic statuses",()=>{
  const page=src("src/app/(authenticated)/admin/batches/page.tsx");
  expect(legacyAcademicStatus("ACTIVE",true)).toBe("Active");
  expect(legacyAcademicStatus("PLANNED",true)).toBe("Inactive");
  expect(legacyAcademicStatus("COMPLETED",true)).toBe("Completed");
  expect(page).toContain("legacyAcademicStatus(status, true)");
 });
 it("SA-academics-people-37 uses exact empty state copy for departments and lecture halls",()=>{
  expect(src("src/components/admin/department-directory.tsx")).toContain("No departments found. Create a college first, then add departments.");
  expect(src("src/components/admin/lecture-hall-manager.tsx")).toContain("No lecture halls found.");
 });
 it("SA-academics-people-41 surfaces per-class learner count, capacity, and full-class warning",()=>{
  const page=src("src/app/(authenticated)/admin/classes/page.tsx");
  expect(page).toContain("row.activeLearners");
  expect(page).toContain("row.capacity");
  expect(page).toContain("Class full");
  expect(page).toContain("Class is full; learners cannot be moved into it.");
 });
 it("SA-academics-people-43 limits legacy program duration to integer years 1–10",()=>{
  for(const yes of ["1","4","10"])expect(validLegacyProgramYears(yes)).toBe(true);
  for(const no of ["0","0.5","10.5","11","12","n/a"])expect(validLegacyProgramYears(no)).toBe(false);
  expect(src("src/components/admin/admin-program-directory.tsx")).toContain("validLegacyProgramYears");
 });
 it("SA-academics-people-44 derives a bounded program code rather than making it mandatory in the UI",()=>{
  expect(deriveSuperAdminProgramCode("Computer Science and Engineering")).toBe("CSAE");
  const page=src("src/components/admin/admin-program-directory.tsx");
  expect(page).toContain("code.trim() || deriveSuperAdminProgramCode(name)");
 });
});
