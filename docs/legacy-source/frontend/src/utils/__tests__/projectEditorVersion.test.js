import { assertProjectEditorVersion } from "../projectEditorVersion";

describe("Projects editors preserve the edit-start revision", () => {
  test.each(["Sprint", "Meeting", "Resource", "Task", "Task details", "Release"])(
    "%s refuses another editor's intervening revision", (label) => {
      expect(() => assertProjectEditorVersion(label, 4, 5)).toThrow(/changed while you were editing/);
    }
  );
  test("permits the original unchanged persisted revision", () => {
    expect(() => assertProjectEditorVersion("Sprint", 4, 4)).not.toThrow();
  });
  test("supports serialized numeric revisions without false conflicts", () => {
    expect(() => assertProjectEditorVersion("Sprint", "4", 4)).not.toThrow();
  });
  test("permits a template-only virtual row that remains virtual", () => {
    expect(() => assertProjectEditorVersion("Task", null, null)).not.toThrow();
  });
  test("rejects a newly materialized virtual row edited by someone else", () => {
    expect(() => assertProjectEditorVersion("Task", null, 0)).toThrow(/changed while you were editing/);
  });
  test("rejects a lost revision in the latest response", () => {
    expect(() => assertProjectEditorVersion("Resource", 2, null)).toThrow(/changed while you were editing/);
  });
  test("does not treat zero as missing", () => {
    expect(() => assertProjectEditorVersion("Resource", 0, 1)).toThrow(/changed while you were editing/);
    expect(() => assertProjectEditorVersion("Resource", 0, 0)).not.toThrow();
  });
});
