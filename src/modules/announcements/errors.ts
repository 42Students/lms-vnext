export type AnnouncementErrorCode =
  | "FORBIDDEN"
  | "TARGET_NOT_FOUND"
  | "ANNOUNCEMENT_NOT_FOUND"
  | "ANNOUNCEMENT_DELETED"
  | "STALE_VERSION"
  | "INVALID_SCHEDULE";

export class AnnouncementError extends Error {
  constructor(public readonly code: AnnouncementErrorCode) {
    super(code);
    this.name = "AnnouncementError";
  }
}
