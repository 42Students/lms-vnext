/** Totals on a bounded directory are visible-page totals, not whole-database counts.
 * The caller must keep the "more records" notice when its probe is truncated.
 */
export function summarizeVisibleCompanyDriveHistory(
  rows: readonly { applicants: number; hired: number }[],
) {
  return {
    drives: rows.length,
    applicants: rows.reduce((sum, row) => sum + row.applicants, 0),
    hired: rows.reduce((sum, row) => sum + row.hired, 0),
  };
}
