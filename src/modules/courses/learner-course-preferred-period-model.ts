/** Prefer a current enrolled term over newer historical/future periods.
 * The choice is based on authorized course rows, never the browser clock. */
export function learnerCoursePreferredPeriod(rows: readonly {
  readOnly: boolean;
  course: { academicPeriodId: string; periodStartDate: string };
}[]): string {
  const candidates = rows.filter((row) => !row.readOnly);
  const eligible = candidates.length > 0 ? candidates : rows;
  return [...eligible].sort((a, b) =>
    b.course.periodStartDate.localeCompare(a.course.periodStartDate) ||
    a.course.academicPeriodId.localeCompare(b.course.academicPeriodId)
  )[0]?.course.academicPeriodId ?? "";
}

/** Reject malformed historical credit values at legacy migration boundaries;
 * never silently turn missing or blank data into zero credits. */
export function legacyLearnerCreditValue(raw:unknown):number|null{
 const credit=typeof raw==="number"?raw:typeof raw==="string"&&raw.trim()!==""?Number(raw):NaN;
 return Number.isFinite(credit)&&credit>=0&&credit<=100?credit:null;
}
