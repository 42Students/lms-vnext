import type { RequestContext } from "@/modules/identity/context";
import type {
  MembershipRole,
  MembershipStatus,
} from "@/modules/identity/constants";
import { requirePermission } from "@/modules/permissions/policy";
import {
  resolveOrCreateIdentity,
  type IdentityDirectory,
} from "./identity";
import {
  listCollegePeopleQuerySchema,
  onboardPersonInputSchema,
  personMembershipIdSchema,
  type ListCollegePeopleQuery,
  type OnboardPersonInput,
} from "./validation";
import { PeopleServiceError } from "./errors";

export type PeopleTargetCollege = {
  id: string;
  organizationId: string;
};

/** Authenticated faculty onboarding profile; persisted with the membership,
 * never in a follow-up write that could leave an incomplete account. */
export type FacultyOnboardingProfile={
 kind:"FACULTY";primaryDepartmentId:string;employmentType:string;
 academicTitle:string;gender:string;dateOfBirth:string;
 address:string;bio:string;contactPhone:string;contactEmail:string;
};

export type PersistPersonMembershipInput = {
  identityUid: string;
  phoneE164: string;
  email?: string;
  displayName: string;
  collegeId: string;
  roles: readonly MembershipRole[];
  facultyProfile?: FacultyOnboardingProfile;
};

export type OnboardedPerson = {
  user: {
    id: string;
    identityUid: string;
    phoneE164: string | null;
    email: string | null;
    displayName: string | null;
  };
  membership: {
    id: string;
    collegeId: string;
    status: "ACTIVE";
    roles: MembershipRole[];
  };
};

export type PersonMembershipView = {
  organizationId: string;
  user: {
    id: string;
    identityUid: string;
    phoneE164: string | null;
    email: string | null;
    displayName: string | null;
  };
  membership: {
    id: string;
    collegeId: string;
    status: MembershipStatus;
    suspendedAt: Date | null;
    suspensionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    roles: MembershipRole[];
  };
};

export type CollegePeoplePage = {
  items: PersonMembershipView[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type PersonOnboardingMutationContext = {
  context: RequestContext;
  organizationId: string;
};

export interface PeopleRepository {
  loadActiveCollege(collegeId: string): Promise<PeopleTargetCollege | null>;
  persistPersonMembership(
    input: PersistPersonMembershipInput,
    mutation: PersonOnboardingMutationContext,
  ): Promise<OnboardedPerson>;
}

export interface PeopleReadRepository {
  loadActiveCollege(collegeId: string): Promise<PeopleTargetCollege | null>;
  listCollegePeople(
    input: ListCollegePeopleQuery,
  ): Promise<CollegePeoplePage>;
  loadMembershipDetail(
    membershipId: string,
  ): Promise<PersonMembershipView | null>;
}

export type OnboardPersonDependencies = {
  identityDirectory: IdentityDirectory;
  repository: PeopleRepository;
};

export async function onboardPerson(
  context: RequestContext,
  rawInput: unknown,
  dependencies: OnboardPersonDependencies,
  facultyProfile?:FacultyOnboardingProfile,
) {
  const input: OnboardPersonInput = onboardPersonInputSchema.parse(rawInput);
  const college = await dependencies.repository.loadActiveCollege(
    input.collegeId,
  );

  if (!college) {
    throw new PeopleServiceError("COLLEGE_NOT_FOUND");
  }

  requirePermission(context, "people.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  // Creating a college administrator or TPO membership is a privileged role
  // grant, even when it happens during first-time onboarding. Apply the same
  // gate used by addMembershipRole before provisioning any identity or account.
  if (input.roles.some((role) => role === "COLLEGE_ADMIN" || role === "TPO")) {
    requirePermission(context, "admin-scope.select");
  }

  const identity = await resolveOrCreateIdentity(
    {
      phoneE164: input.phoneE164,
      ...(input.email !== undefined ? { email: input.email } : {}),
      displayName: input.displayName,
    },
    dependencies.identityDirectory,
  );

  const resolvedEmail = input.email ?? identity.email;
  return dependencies.repository.persistPersonMembership(
    {
      identityUid: identity.uid,
      phoneE164: input.phoneE164,
      ...(resolvedEmail != null ? { email: resolvedEmail } : {}),
      displayName: input.displayName,
      collegeId: college.id,
      roles: input.roles,
      ...(facultyProfile?{facultyProfile}:{}),
    },
    {
      context,
      organizationId:
        college.organizationId,
    },
  );
}

export async function listCollegePeople(
  context: RequestContext,
  rawQuery: unknown,
  repository: PeopleReadRepository,
) {
  const query = listCollegePeopleQuerySchema.parse(rawQuery);
  const college = await repository.loadActiveCollege(query.collegeId);

  if (!college) {
    throw new PeopleServiceError("COLLEGE_NOT_FOUND");
  }

  requirePermission(context, "people.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return repository.listCollegePeople(query);
}

export async function getPersonMembershipDetail(
  context: RequestContext,
  membershipIdInput: string,
  repository: PeopleReadRepository,
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
