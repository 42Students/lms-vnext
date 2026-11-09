/** A failed response after PUT cannot prove the database rolled back. */
export function templateCollegeBulkFailureNotice(error: unknown, saveAttempted: boolean): string {
  const message = error instanceof Error && error.message.trim()
    ? error.message.trim()
    : "College assignments could not be updated.";
  return saveAttempted
    ? `${message} The save request was sent, but its result could not be confirmed. Refresh assignments to check the current state before retrying.`
    : `${message} No save request was sent. Refresh assignments and try again.`;
}
