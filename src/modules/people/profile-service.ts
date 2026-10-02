import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PeopleServiceError } from "./errors";
import {
  facultyProfileInputSchema,
  learnerProfileInputSchema,
  type FacultyProfileInput,
  type LearnerProfileInput,
} from "./profile-validation";
import type { PersonMembershipView } from "./service";
import { personMembershipIdSchema } from "./validation";

export type LearnerProfileView = {
  membershipId: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FacultyProfileView = {
  membershipId: string;
  primaryDepartmentId: string | null;
  employmentType: string | null;
  academicTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProfileRepository {
  loadMembershipDetail(
    membershipId: string,
  ): Promise<PersonMembershipView | null>;
  loadLearnerProfile(
    membershipId: string,
  ): Promise<LearnerProfileView | null>;
  upsertLearnerProfile(
    membershipId: string,
    input: LearnerProfileInput,
  ): Promise<LearnerProfileView>;
  loadFacultyProfile(
    membershipId: string,
  ): Promise<FacultyProfileView | null>;
  upsertFacultyProfile(
    membershipId: string,
    input: FacultyProfileInput,
  ): Promise<FacultyProfileView>;
  hasActiveDepartment(
    departmentId: string,
    collegeId: string,
  ): Promise<boolean>;
}

async function loadAuthorizedProfileTarget(
  context: RequestContext,
  membershipIdInput: string,
  repository: ProfileRepository,
) {
  const membershipId = personMembershipIdSchema.parse(membershipIdInput);
  const person = await repository.loadMembershipDetail(membershipId);

  if (!person) {
    throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
  }

  requirePermission(context, "people.manage", {
    organizationId: person.organizationId,
    collegeId: person.membership.collegeId,
  });

  return person;
}

function requireProfileRole(
  person: PersonMembershipView,
  role: "LEARNER" | "FACULTY",
) {
  if (!person.membership.roles.includes(role)) {
    throw new PeopleServiceError(
      role === "LEARNER"
        ? "LEARNER_ROLE_REQUIRED"
        : "FACULTY_ROLE_REQUIRED",
    );
  }
}

function requireMutableProfile(person: PersonMembershipView) {
  if (person.membership.status === "ENDED") {
    throw new PeopleServiceError("MEMBERSHIP_ENDED");
  }
}

export async function getLearnerProfile(
  context: RequestContext,
  membershipIdInput: string,
  repository: ProfileRepository,
) {
  const person = await loadAuthorizedProfileTarget(
    context,
    membershipIdInput,
    repository,
  );
  requireProfileRole(person, "LEARNER");

  return repository.loadLearnerProfile(person.membership.id);
}

export async function upsertLearnerProfile(
  context: RequestContext,
  membershipIdInput: string,
  rawInput: unknown,
  repository: ProfileRepository,
) {
  const input = learnerProfileInputSchema.parse(rawInput);
  const person = await loadAuthorizedProfileTarget(
    context,
    membershipIdInput,
    repository,
  );
  requireMutableProfile(person);
  requireProfileRole(person, "LEARNER");

  return repository.upsertLearnerProfile(
    person.membership.id,
    input,
  );
}

export async function getFacultyProfile(
  context: RequestContext,
  membershipIdInput: string,
  repository: ProfileRepository,
) {
  const person = await loadAuthorizedProfileTarget(
    context,
    membershipIdInput,
    repository,
  );
  requireProfileRole(person, "FACULTY");

  return repository.loadFacultyProfile(person.membership.id);
}

export async function upsertFacultyProfile(
  context: RequestContext,
  membershipIdInput: string,
  rawInput: unknown,
  repository: ProfileRepository,
) {
  const input = facultyProfileInputSchema.parse(rawInput);
  const person = await loadAuthorizedProfileTarget(
    context,
    membershipIdInput,
    repository,
  );
  requireMutableProfile(person);
  requireProfileRole(person, "FACULTY");

  if (
    input.primaryDepartmentId &&
    !(await repository.hasActiveDepartment(
      input.primaryDepartmentId,
      person.membership.collegeId,
    ))
  ) {
    throw new PeopleServiceError("DEPARTMENT_NOT_FOUND");
  }

  return repository.upsertFacultyProfile(
    person.membership.id,
    input,
  );
}
