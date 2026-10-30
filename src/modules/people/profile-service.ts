import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import { PeopleServiceError } from "./errors";
import {
  emptyLearnerProfileDocument,
  facultyProfileInputSchema,
  learnerProfileDocumentSchema,
  learnerProfileInputSchema,
  type FacultyProfileInput,
  type LearnerProfileDocument,
  type LearnerProfileInput,
} from "./profile-validation";
import type { PersonMembershipView } from "./service";
import { personMembershipIdSchema } from "./validation";

export type LearnerProfileView = {
  membershipId: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  profileDocument: LearnerProfileDocument;
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
  upsertLearnerProfileDocument(
    membershipId: string,
    document: LearnerProfileDocument,
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


/**
 * The legacy Faculty profile belongs to a teaching Faculty account, not a
 * Mentor or College Admin alias. This read never uses people.manage.
 */
function requireOwnFacultyMembership(context: RequestContext) {
  const membership = context.membership;
  if (
    !membership ||
    !hasMembershipRole(context, "FACULTY") ||
    hasMembershipRole(context, "MENTOR") ||
    hasMembershipRole(context, "COLLEGE_ADMIN")
  ) {
    throw new AuthorizationError("profile.self.manage");
  }
  requirePermission(context, "profile.self.manage", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  return membership;
}

export async function getOwnFacultyProfile(
  context: RequestContext,
  repository: ProfileRepository,
) {
  const membership = requireOwnFacultyMembership(context);
  const person = await repository.loadMembershipDetail(membership.id);
  if (
    !person ||
    person.user.id !== context.user.id ||
    person.membership.id !== membership.id ||
    person.membership.collegeId !== membership.collegeId ||
    person.organizationId !== membership.organizationId ||
    person.membership.status !== "ACTIVE" ||
    // The request context is already narrowed to the explicit active portal
    // role by resolveRequestContext. Persisted membership can legitimately
    // include an additional Mentor/Admin grant: those *inactive* roles must
    // not prevent the user reading their own selected Faculty profile.
    !person.membership.roles.includes("FACULTY")
  ) {
    throw new AuthorizationError("profile.self.manage");
  }

  return {
    person,
    profile: await repository.loadFacultyProfile(membership.id),
  };
}

function requireOwnLearnerMembership(
  context: RequestContext,
) {
  if (
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("academics.read");
  }

  return context.membership;
}

export async function getOwnLearnerProfile(
  context: RequestContext,
  repository: ProfileRepository,
) {
  const membership =
    requireOwnLearnerMembership(context);
  const person = await repository.loadMembershipDetail(
    membership.id,
  );

  if (!person) {
    throw new PeopleServiceError(
      "MEMBERSHIP_NOT_FOUND",
    );
  }

  const profile =
    await repository.loadLearnerProfile(
      membership.id,
    );

  return {
    person,
    profile: profile ?? {
      membershipId: membership.id,
      rollNumber: null,
      registrationNumber: null,
      profileDocument:
        emptyLearnerProfileDocument,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
  };
}

export async function upsertOwnLearnerProfileDocument(
  context: RequestContext,
  rawInput: unknown,
  repository: ProfileRepository,
) {
  const membership =
    requireOwnLearnerMembership(context);
  const document =
    learnerProfileDocumentSchema.parse(rawInput);

  if (document.identity.aadhaarNumber || document.identity.panNumber) {
    throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  }
  return repository.upsertLearnerProfileDocument(
    membership.id,
    document,
  );
}
