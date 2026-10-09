/** Exact-source grade conversion to comparable integer percentage basis points.
 * Original grade / scale / max remains unchanged when a college changes policy.
 * Uses decimal strings + bigint rational arithmetic for deterministic HALF_UP. */
export type CgpaRule = "X9_5" | "MINUS_0_5_X10" | "MINUS_0_75_X10" | "X10";
export const DEFAULT_CGPA_RULE: CgpaRule = "X9_5";
export type RawAcademicMark = { grade: string; scale: string | null; max: string | null };
type Rational = { num: bigint; den: bigint };

function decimal(raw: string | null): Rational | null {
  if (raw === null) return null;
  let value = raw.trim().replace(/%/g, "");
  if (value.includes(",") && !value.includes(".")) value = value.replace(",", ".");
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match || value.length > 40) return null;
  const fractional = match[3] ?? "";
  const den = 10n ** BigInt(fractional.length);
  const num = BigInt((match[2] ?? "0") + fractional) * (match[1] === "-" ? -1n : 1n);
  return {num, den};
}
function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const left = a.num * b.den, right = b.num * a.den;
  return left < right ? -1 : left > right ? 1 : 0;
}
const integer = (i: number): Rational => ({num: BigInt(i), den: 1n});
function roundHalfUp(num: bigint, den: bigint): bigint {
  return (2n * num + den) / (2n * den);
}
function basisPoints(out: Rational, roundAtFourDecimalPlaces = false): number {
  if (compare(out, integer(100)) > 0) return 10000;
  if (out.num <= 0n) return 0;
  const units = roundAtFourDecimalPlaces ? roundHalfUp(out.num * 10000n, out.den) : null;
  return Number(units === null
    ? roundHalfUp(out.num * 100n, out.den)
    : roundHalfUp(units, 100n));
}
export function normaliseMarkScale(source: string | null): "PERCENTAGE" | "CGPA" | "GPA" | "GRADE" {
  const s = (source ?? "").trim().toUpperCase();
  if (s.startsWith("PERCENT") || s === "%" || s === "") return "PERCENTAGE";
  if (["CGPA", "CPI", "SGPA"].includes(s)) return "CGPA";
  if (s === "GPA") return "GPA";
  return "GRADE";
}
export function normaliseCgpaRule(input: string | null | undefined): CgpaRule {
  return input === "MINUS_0_5_X10" || input === "MINUS_0_75_X10" ||
    input === "X10" || input === "X9_5" ? input : DEFAULT_CGPA_RULE;
}
/** Comparable percentage in basis points (87.40% => 8740) or null. */
export function convertedPercentageBasisPoints(
  mark: RawAcademicMark, rule: string | null = null,
): number | null {
  const grade = decimal(mark.grade);
  if (!grade || grade.num < 0n) return null;
  let scale = normaliseMarkScale(mark.scale);
  if (scale === "GRADE") {
    if (compare(grade, integer(10)) > 0) return null;
    scale = "CGPA";
  }
  if (scale === "PERCENTAGE") {
    if (compare(grade, integer(100)) <= 0) return basisPoints(grade);
    const max = decimal(mark.max);
    if (!max || max.num <= 0n || compare(max, grade) < 0) return null;
    return basisPoints({num: grade.num * max.den * 100n,
      den: grade.den * max.num}, true);
  }
  const suppliedMax = decimal(mark.max);
  const acceptedMax = suppliedMax && [4, 5, 10].some(n => compare(suppliedMax, integer(n)) === 0)
    ? suppliedMax : integer(10);
  if (compare(grade, acceptedMax) > 0) return null;
  if (compare(acceptedMax, integer(10)) !== 0) {
    return basisPoints({num: grade.num * acceptedMax.den * 100n,
      den: grade.den * acceptedMax.num}, true);
  }
  const key = normaliseCgpaRule(rule);
  if (key === "X9_5") return basisPoints({num: grade.num * 95n, den: grade.den * 10n});
  if (key === "X10") return basisPoints({num: grade.num * 10n, den: grade.den});
  const half = key === "MINUS_0_5_X10" ? 1n : 3n;
  const denom = key === "MINUS_0_5_X10" ? 2n : 4n;
  return basisPoints({num: (grade.num * denom - half * grade.den) * 10n,
    den: grade.den * denom});
}
/** Recompute derived percentages from unchanged raw marks, retaining rule key. */
export function calculateComparableMarks<T extends string>(
  marks: Record<T, RawAcademicMark>, rule: string | null,
): Record<T, {raw: RawAcademicMark; percentageBasisPoints: number | null; appliedRule: CgpaRule}> {
  return Object.fromEntries(Object.entries(marks).map(([level, original]) => {
    const raw = original as RawAcademicMark;
    return [level, {raw: {...raw}, percentageBasisPoints: convertedPercentageBasisPoints(raw, rule),
      appliedRule: normaliseCgpaRule(rule)}];
  })) as Record<T, {raw: RawAcademicMark; percentageBasisPoints: number | null; appliedRule: CgpaRule}>;
}
