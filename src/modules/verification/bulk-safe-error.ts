/** The server's error payload is not a user-facing diagnostic channel. */
export function safeCollegeBulkReviewFailure(value:unknown):string {
 const code=value instanceof Error?value.message:value;
 switch(code){
  case "INVALID_ORIGIN":return "Request origin was not accepted. Reload this page and retry.";
  case "VERIFICATION_UNAVAILABLE":return "Verification is temporarily unavailable. Retry later.";
  case "STALE_VERSION":return "One or more requests changed. Refresh before reviewing again.";
  case "FORBIDDEN":return "You no longer have permission to review these requests.";
  default:return "Unable to complete the bulk review. Refresh the queue to check saved decisions.";
 }
}
