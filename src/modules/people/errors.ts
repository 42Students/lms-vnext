export type PeopleServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "MEMBERSHIP_NOT_FOUND"
  | "IDENTITY_COLLISION"
  | "IDENTITY_CONTACT_REQUIRED"
  | "MEMBERSHIP_NOT_ACTIVE"
  | "MEMBERSHIP_ENDED"
  | "LAST_MEMBERSHIP_ROLE"
  | "LEARNER_ROLE_REQUIRED"
  | "FACULTY_ROLE_REQUIRED"
  | "FACULTY_PROFILE_VERSION_CONFLICT"
  | "DEPARTMENT_NOT_FOUND"
  | "PRIVATE_IDENTITY_STORAGE_NOT_READY";

export class PeopleServiceError extends Error {
  constructor(public readonly code: PeopleServiceErrorCode) {
    super(code);
    this.name = "PeopleServiceError";
  }
}
