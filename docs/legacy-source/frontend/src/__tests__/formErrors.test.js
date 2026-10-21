import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

describe("server form errors", () => {
  test("maps an object of backend field errors through aliases", () => {
    const setFields = jest.fn();
    const applied = applyServerFieldErrors(
      { setFields },
      { response: { data: { fieldErrors: { dept_id: "Department is invalid", duration_years: ["Too short"] } } } },
      { dept_id: "deptId", duration_years: "durationYears" }
    );

    expect(applied).toBe(true);
    expect(setFields).toHaveBeenCalledWith([
      { name: "deptId", errors: ["Department is invalid"] },
      { name: "durationYears", errors: ["Too short"] },
    ]);
  });

  test("maps array validation errors", () => {
    const setFields = jest.fn();
    expect(applyServerFieldErrors(
      { setFields },
      { response: { data: { errors: [{ field: "name", message: "Already exists" }] } } }
    )).toBe(true);
    expect(setFields).toHaveBeenCalledWith([{ name: "name", errors: ["Already exists"] }]);
  });

  test("returns false for unstructured errors without touching the form", () => {
    const setFields = jest.fn();
    expect(applyServerFieldErrors({ setFields }, new Error("Network error"))).toBe(false);
    expect(setFields).not.toHaveBeenCalled();
  });

  test("prefers the server message for a stable form-level error", () => {
    expect(getServerFormError(
      { response: { data: { message: "Program name already exists" } } },
      "Fallback"
    )).toBe("Program name already exists");
  });
});
