/** Pure rule: non-timed resources and ended classes can be manually completed. */
export function manualContentCompletionGate(contentType: string, endsAt: Date | null, now: Date):
  "ALLOWED" | "TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED" | "LIVE_CLASS_NOT_FINISHED" {
  if (contentType === "VIDEO" || contentType === "YOUTUBE") return "TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED";
  if (contentType === "LIVE_CLASS" && endsAt && endsAt.getTime() > now.getTime()) return "LIVE_CLASS_NOT_FINISHED";
  return "ALLOWED";
}