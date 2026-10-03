export type PlacementsServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "PLACEMENT_COMPANY_IDENTITY_CONFLICT"
  | "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND"
  | "PLACEMENT_OWNER_MEMBERSHIP_NOT_FOUND"
  | "PLACEMENT_OWNER_ROLE_REQUIRED";

export class PlacementsServiceError extends Error {
  constructor(
    public readonly code: PlacementsServiceErrorCode,
  ) {
    super(code);
    this.name = "PlacementsServiceError";
  }
}
