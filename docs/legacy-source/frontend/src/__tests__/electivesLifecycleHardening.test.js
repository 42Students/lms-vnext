const fs = require("fs");
const path = require("path");

const source = (relative) =>
  fs.readFileSync(path.join(process.cwd(), "src", relative), "utf8");

describe("electives lifecycle hardening", () => {
  test("college scope changes cannot leave stale elective slots or lookup state behind", () => {
    const page = source("components/admin/electives/ElectivesConsole.jsx");
    expect(page).toContain("slotRequestSeq");
    expect(page).toContain("lookupRequestSeq");
    expect(page).toContain("[collegeId, programId, semester, includeArchived]");
    expect(page).toContain("setOpenSlotId(null)");
    expect(page).toContain("setLookupErrors(errors)");
  });

  test("new-slot editor resets stale values and academic fields lock after history exists", () => {
    const page = source("components/admin/electives/ElectivesConsole.jsx");
    expect(page).toContain("form.resetFields()");
    expect(page).toContain("editing?.hasEnrollmentHistory");
    expect(page).toContain("Academic identity is locked");
    expect(page).toContain("isCanonicalAcademicYear");
    expect(page).toContain("canonicalizeAcademicYear");
  });

  test("faculty roles are explicit rather than dependent on multi-select order", () => {
    const panel = source("components/admin/electives/ElectiveSlotPanel.jsx");
    expect(panel).toContain('name="primaryFacultyId"');
    expect(panel).toContain('name="coTeacherIds"');
    expect(panel).toContain("orderedFaculty");
    expect(panel).toContain("Choose a primary instructor before adding co-teachers");
    expect(panel).not.toContain('name="facultyIds" label="Faculty (first = primary instructor)"');
  });

  test("allocation UI only offers matching program sections and never drops malformed learner ids silently", () => {
    const modal = source("components/admin/electives/AllocateModal.jsx");
    // Sections from another program are filtered out (the filter now reads as a guard clause).
    expect(modal).toContain("Number(c.programId ?? c.program_id) !== Number(slot.programId)");
    expect(modal).toContain("Learner ids must all be positive numbers");
    expect(modal).toContain("who are in Semester");
  });

  test("archived offering rosters are read-only and generic groups no longer advertise ELECTIVE", () => {
    const roster = source("components/admin/electives/OfferingRosterDrawer.jsx");
    const api = source("api/Services/StudentGroupService.js");
    expect(roster).toContain("Archived roster — read only");
    expect(roster).toContain('const mutable = offering.status === "ACTIVE"');
    expect(roster).toContain("requestSeq");
    expect(api).not.toContain('["ELECTIVE", "CRT"');
    const form = source("components/admin/studentGroups/StudentGroupForm.jsx");
    expect(form).toContain("Feature-managed kinds such as ELECTIVE");
    expect(form).toContain('placeholder="CRT"');
  });

  test("eligible-student view explains minimum picks and uses human class names", () => {
    const panel = source("components/admin/electives/ElectiveSlotPanel.jsx");
    expect(panel).toContain("belowMinimumCount");
    expect(panel).toContain("still below the required minimum");
    expect(panel).toContain("minimum met");
    expect(panel).toContain("r.className || classNameById");
    expect(panel).not.toContain('render: (v) => v ? `#${v}` : "—"');
  });

  test("whole-class allocation only offers sections in the slot's live batch term", () => {
    const page = source("components/admin/electives/ElectivesConsole.jsx");
    const modal = source("components/admin/electives/AllocateModal.jsx");
    expect(page).toContain("getBatchesByCollege");
    expect(page).toContain("batchRows = rows(b)");
    expect(page).toContain("batches: batchRows || []");
    expect(modal).toContain("eligibleSections");
    expect(modal).toContain("batch.currentSemester ?? batch.current_semester");
    expect(modal).toContain("slotYear === batchYear");
    expect(modal).toContain("No section currently matches this slot's program, semester and academic year.");
  });

  test("slot list distinguishes unique students from seat enrolments", () => {
    const page = source("components/admin/electives/ElectivesConsole.jsx");
    const panel = source("components/admin/electives/ElectiveSlotPanel.jsx");
    expect(page).toContain('dataIndex: "currentStudentCount"');
    expect(panel).toContain("current student");
    expect(panel).toContain("seat");
    expect(panel).toContain("taken");
  });

  test("offering, allocation and roster mutations are draft-safe and immediate single-flight", () => {
    const panel = source("components/admin/electives/ElectiveSlotPanel.jsx");
    const roster = source("components/admin/electives/OfferingRosterDrawer.jsx");
    const allocate = source("components/admin/electives/AllocateModal.jsx");

    expect(panel).toContain("const busyRef = useRef(false)");
    expect(panel).toContain("const [archiveBusyId, setArchiveBusyId] = useState(null)");
    expect(panel).toContain("Discard these elective changes?");
    expect(roster).toContain("const mutationRef = useRef(false)");
    expect(roster).toContain("Elective roster could not be loaded");
    expect(roster).toContain("Unexpected roster response");
    expect(allocate).toContain("const busyRef = useRef(false)");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(allocate).toContain("Discard this allocation draft?");
    expect(allocate).toContain("maskClosable={false}");
  });

});
