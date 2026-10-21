/**
 * Compare the entity revision captured when a form OPENED to a fresh server revision.
 * Never silently swap the form's original version for a newly fetched version at save time.
 */
export function assertProjectEditorVersion(label, openedVersion, latestVersion) {
  const hasOpened = openedVersion !== null && openedVersion !== undefined;
  const hasLatest = latestVersion !== null && latestVersion !== undefined;
  if (!hasOpened && !hasLatest) return;
  if (!hasOpened || !hasLatest || String(openedVersion) !== String(latestVersion)) {
    throw new Error(`${label} changed while you were editing it. Refresh and reopen the editor before saving.`);
  }
}
