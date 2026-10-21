import { groupLogEntries, normalizeLogShape } from "../logGrouping";

describe("logGrouping", () => {
  test("collapses a burst of the same error shape into one group with a count", () => {
    const entries = [
      { severity: "ERROR", message: "Learner 42 not found", httpPath: "/api/v1/learner/42" },
      { severity: "ERROR", message: "Learner 9981 not found", httpPath: "/api/v1/learner/9981" },
      { severity: "ERROR", message: "Something else entirely", httpPath: "/api/v1/x" },
    ];
    const grouped = groupLogEntries(entries);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].count).toBe(2);
    expect(grouped[1].count).toBe(1);
  });

  test("different severities are never merged even with the same message shape", () => {
    const entries = [
      { severity: "WARNING", message: "Retrying", httpPath: "/x" },
      { severity: "ERROR", message: "Retrying", httpPath: "/x" },
    ];
    expect(groupLogEntries(entries)).toHaveLength(2);
  });

  test("empty/missing input returns an empty array, not a throw", () => {
    expect(groupLogEntries([])).toEqual([]);
    expect(groupLogEntries(null)).toEqual([]);
    expect(groupLogEntries(undefined)).toEqual([]);
  });

  test("normalizeLogShape strips ids so shape matches regardless of which id", () => {
    const a = normalizeLogShape({ message: "User 1 failed", httpPath: "/api/v1/x/1" });
    const b = normalizeLogShape({ message: "User 2 failed", httpPath: "/api/v1/x/2" });
    expect(a).toBe(b);
  });
});
