export type PeopleServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "MEMBERSHIP_NOT_FOUND"
  | "IDENTITY_COLLISION"
  | "MEMBERSHIP_NOT_ACTIVE"
  | "MEMBERSHIP_ENDED"
  | "LAST_MEMBERSHIP_ROLE"
  | "LEARNER_ROLE_REQUIRED"
  | "FACULTY_ROLE_REQUIRED"
  | "DEPARTMENT_NOT_FOUND";

export class PeopleServiceError extends Error {
  constructor(public readonly code: PeopleServiceErrorCode) {
    super(code);
    this.name = "PeopleServiceError";
  }
}
