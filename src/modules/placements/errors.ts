export type PlacementsServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "PLACEMENT_COMPANY_IDENTITY_CONFLICT"
  | "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND"
  | "PLACEMENT_OWNER_MEMBERSHIP_NOT_FOUND"
  | "PLACEMENT_OWNER_ROLE_REQUIRED"
  | "PLACEMENT_JOB_NOT_FOUND"
  | "PLACEMENT_JOB_NOT_EDITABLE"
  | "PLACEMENT_JOB_INVALID_CTC_RANGE"
  | "PLACEMENT_JOB_EXTERNAL_URL_REQUIRED"
  | "PLACEMENT_JOB_NOT_PUBLISHABLE"
  | "PLACEMENT_JOB_NOT_CLOSABLE"
  | "PLACEMENT_JOB_CLOSE_BEFORE_ARCHIVE";

export class PlacementsServiceError extends Error {
  constructor(
    public readonly code: PlacementsServiceErrorCode,
  ) {
    super(code);
    this.name = "PlacementsServiceError";
  }
}
