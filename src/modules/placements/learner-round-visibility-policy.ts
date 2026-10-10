/**
 * Legacy employer assessments are TEST/VENDOR_TEST rounds; interviews and
 * group discussions are separate. Names are freely editable and must never
 * decide which student tab a round appears in.
 */
export type CareerRoundView = "ASSESSMENT" | "INTERVIEW" | "CALENDAR";

export function isCareerRoundVisible(
  view: CareerRoundView,
  roundKind: string,
): boolean {
  if (view === "CALENDAR") return true;
  if (view === "ASSESSMENT") {
    return roundKind === "TEST" || roundKind === "VENDOR_TEST";
  }
  return roundKind === "INTERVIEW" || roundKind === "GD";
}
