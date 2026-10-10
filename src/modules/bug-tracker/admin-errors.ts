export type TrackerAdminErrorCode =
  | "FORBIDDEN"
  | "ISSUE_NOT_FOUND"
  | "STALE_VERSION"
  | "INVALID_INPUT";

export class TrackerAdminError extends Error {
  constructor(public readonly code: TrackerAdminErrorCode) {
    super(code);
    this.name = "TrackerAdminError";
  }
}
