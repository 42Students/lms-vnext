/** A closed dialog or an older page request must not replace a newer
 * College Admin import-history result (even if fetch ignored cancellation).
 * Keep the check pure so back/forward and slow-network ordering can be
 * exercised without a browser or a backend.
 */
export function isCurrentCollegeImportHistoryRequest(
  requestVersion: number,
  latestVersion: number,
  aborted: boolean,
): boolean {
  return Number.isSafeInteger(requestVersion) &&
    requestVersion > 0 &&
    Number.isSafeInteger(latestVersion) &&
    latestVersion === requestVersion &&
    !aborted;
}
