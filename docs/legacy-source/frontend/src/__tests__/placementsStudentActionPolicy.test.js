import {
  isSupportedAssessmentUrl,
  classifyApplicationLookup,
} from "@/utils/placementsStudentActionPolicy";

describe("student placements action safety policies", () => {
  test.each([
    ["https://example.com/test", true],
    ["http://example.com/test", true],
    [" HTTPS://example.com/test ", true],
    ["http://", false],
    ["javascript:alert(1)", false],
    ["https://user:pass@example.com/test", false],
    ["", false],
    [null, false],
  ])("assessment URL %s validity is %s", (url, expected) => {
    expect(isSupportedAssessmentUrl(url)).toBe(expected);
  });

  test.each([
    [undefined, "unknown"],
    [{ data: { status: "error", data: { applied: false } } }, "unknown"],
    [{ data: { status: "success", data: {} } }, "unknown"],
    [{ data: { status: "success", data: { applied: null } } }, "unknown"],
    [{ data: { status: "success", data: { applied: "false" } } }, "unknown"],
    [{ data: { status: "success", data: { applied: false } } }, "not-applied"],
    [{ data: { status: "success", data: { applied: true } } }, "applied"],
  ])("application lookup never invents a result for %p", (response, expected) => {
    expect(classifyApplicationLookup(response)).toBe(expected);
  });
});
