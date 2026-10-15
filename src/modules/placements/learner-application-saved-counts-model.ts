export function learnerApplicationSavedStatusCounts(rows: readonly { applicationStatus: string }[]) {
  return { total: rows.length, submitted: rows.filter(row => row.applicationStatus === "SUBMITTED").length,
    withdrawn: rows.filter(row => row.applicationStatus === "WITHDRAWN").length };
}
