// One-tap eligibility sets the placement cell uses most. "Open to all" clears every rule; the others fill only the field they
// name and leave the rest as the TPO set it. "% throughout" alone covers 10th, 12th (or Diploma) and UG: it is the lowest of them.
export const OPEN_TO_ALL = {
  batchIds: [], branches: [], passingYears: [], minCgpa: undefined, minPctThroughout: undefined, tenthMinPct: undefined, twelfthMinPct: undefined,
  diplomaMinPct: undefined, ugMinPct: undefined, pgMinPct: undefined, gender: undefined, verifiedMarksOnly: false,
};
export const ELIGIBILITY_PRESETS = [
  { key: "open", label: "Open to all", values: OPEN_TO_ALL },
  { key: "cgpa6", label: "CGPA 6.0+", values: { minCgpa: 6 } },
  { key: "cgpa7", label: "CGPA 7.0+", values: { minCgpa: 7 } },
  { key: "pct60", label: "60% throughout", values: { minPctThroughout: 60 } },
  { key: "pct70", label: "70% throughout", values: { minPctThroughout: 70 } },
];

/** A CGPA cutoff as a % by the college's rule (Settings > Placement rules), for students whose degree is graded in %. */
export function cgpaAsPct(cgpa, rule) {
  if (cgpa === null || cgpa === undefined || cgpa === "") return null;
  const g = Number(cgpa);
  const v = rule === "MINUS_0_5_X10" ? (g - 0.5) * 10 : rule === "MINUS_0_75_X10" ? (g - 0.75) * 10 : rule === "X10" ? g * 10 : g * 9.5;
  return Math.max(0, Math.min(100, Number(v.toFixed(1))));
}

/** Branch and passing-year choices from the college's own students, so nobody can mistype "CSE" as "CES" and silently exclude a branch. */
export function optionsFromStudents(students) {
  const uniq = (xs) => [...new Set(xs.filter((x) => x !== null && x !== undefined && String(x).trim() !== "").map((x) => String(x).trim()))];
  const branches = uniq((students || []).map((s) => s.branch)).sort();
  const years = uniq((students || []).map((s) => s.batch)).sort();
  return { branches, years };
}
