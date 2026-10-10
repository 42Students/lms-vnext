export type ActivityServiceErrorCode =
  | "ACTIVITY_SCOPE_NOT_FOUND"
  | "ACTIVITY_SCOPE_MISMATCH"
  | "ACTIVITY_EVENT_NOT_FOUND"
  | "NOTIFICATION_NOT_FOUND"
  | "NOTIFICATION_RECIPIENT_NOT_FOUND"
  | "NOTIFICATION_SCOPE_MISMATCH";

export class ActivityServiceError extends Error {
  constructor(
    public readonly code: ActivityServiceErrorCode,
  ) {
    super(code);
    this.name = "ActivityServiceError";
  }
}
