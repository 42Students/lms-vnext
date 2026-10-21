import {
  classifyApplicationLookup,
  requireVerifiedApplicationLookup,
} from "@/utils/placementsAppliedLookup";

describe("Placements application lookup must fail closed", () => {
  test.each([
    [null, "unknown"],
    [undefined, "unknown"],
    [{ data: { status: "error", data: { applied: false } } }, "unknown"],
    [{ data: { status: "success", data: {} } }, "unknown"],
    [{ data: { status: "success", data: { applied: "false" } } }, "unknown"],
    [{ data: { status: "success", data: { applied: 0 } } }, "unknown"],
    [{ data: { status: "success", data: { applied: null } } }, "unknown"],
    [{ data: { status: "success", data: { applied: false } } }, "not-applied"],
    [{ data: { status: "success", data: { applied: true } } }, "applied"],
  ])("classifies %p as %s", (response, expected) => {
    expect(classifyApplicationLookup(response)).toBe(expected);
  });

  test("rejects malformed successful responses before a write", () => {
    expect(() => requireVerifiedApplicationLookup({ data: { status: "success", data: {} } }))
      .toThrow(/couldn't verify/i);
  });

  test("preserves authoritative application responses", () => {
    const response = { data: { status: "success", data: { applied: false } } };
    expect(requireVerifiedApplicationLookup(response)).toBe(response);
  });
});
