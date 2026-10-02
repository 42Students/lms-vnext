export type PeopleServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "MEMBERSHIP_NOT_FOUND"
  | "IDENTITY_COLLISION"
  | "MEMBERSHIP_NOT_ACTIVE";

export class PeopleServiceError extends Error {
  constructor(public readonly code: PeopleServiceErrorCode) {
    super(code);
    this.name = "PeopleServiceError";
  }
}
