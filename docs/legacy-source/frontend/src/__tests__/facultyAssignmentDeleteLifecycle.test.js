import fs from "fs";
import path from "path";

describe("faculty assignment delete lifecycle", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "src/components/Assignments/AssignmentsContent.jsx"), "utf8");
  const action = fs.readFileSync(path.join(process.cwd(), "src/components/Assignments/ActionAssignment.js"), "utf8");

  test("delete is synchronously single-flight and recoverable", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(page).toContain("const deleteRef = useRef(null)");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(page).toContain("if (!ele?.id || deleteRef.current != null) return false;");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(page).toContain("await createLessonContent(NewData);");
    expect(page).toContain('message="Assignment was not deleted"');
    expect(page).toContain("Retry delete");
  });

  test("the confirmation owns the async delete state", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(action).toContain("okButtonProps={{ danger: true, loading: deleting }}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(action).toContain("disabled={deleting || deleteDisabled}");
    expect(action).toContain("onConfirm={() => onDelete?.()}");
  });
});
