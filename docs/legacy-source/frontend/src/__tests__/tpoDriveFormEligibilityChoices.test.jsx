/**
 * TPO UX batch 1: branches and passing years are picked from the college's real students (no
 * mistyped "CES" silently excluding a branch), and common eligibility sets are one tap.
 */
import { ELIGIBILITY_PRESETS, optionsFromStudents } from "@/components/tpo/eligibilityPresets";

test("choices come from the real roster, de-duplicated, trimmed and sorted", () => {
  const { branches, years } = optionsFromStudents([
    { branch: "ECE", batch: "2027" }, { branch: " CSE ", batch: 2027 }, { branch: "CSE", batch: "2026" }, { branch: null, batch: "" }, { branch: "", batch: undefined },
  ]);
  expect(branches).toEqual(["CSE", "ECE"]);
  expect(years).toEqual(["2026", "2027"]);
});

test("no roster means no choices (the form falls back to free entry rather than blocking)", () => {
  expect(optionsFromStudents(undefined)).toEqual({ branches: [], years: [] });
});

test("presets name only the fields they set, and 'Open to all' clears the thresholds", () => {
  const byKey = Object.fromEntries(ELIGIBILITY_PRESETS.map((p) => [p.key, p.values]));
  expect(byKey.cgpa6).toEqual({ minCgpa: 6 });
  expect(byKey.cgpa7.minCgpa).toBe(7);
  expect(JSON.stringify(ELIGIBILITY_PRESETS)).not.toMatch(/acklog/); // no backlog rules: the LMS has no source for them
  // "Open to all" clears every rule: thresholds unset, lists empty, verified-only off.
  expect(Object.keys(byKey.open)).toEqual(expect.arrayContaining(["minCgpa", "minPctThroughout", "ugMinPct", "pgMinPct", "branches", "batchIds", "gender"]));
  expect(Object.entries(byKey.open).every(([, v]) => v === undefined || v === false || (Array.isArray(v) && v.length === 0))).toBe(true);
  expect(byKey.pct60).toEqual({ minPctThroughout: 60 });
  expect(byKey.cgpa6).not.toHaveProperty("branches");
});
