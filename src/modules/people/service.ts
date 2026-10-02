import type { RequestContext } from "@/modules/identity/context";
import type { MembershipRole } from "@/modules/identity/constants";
import { requirePermission } from "@/modules/permissions/policy";
import {
  resolveOrCreateIdentity,
  type IdentityDirectory,
} from "./identity";
import {
  onboardPersonInputSchema,
  type OnboardPersonInput,
} from "./validation";
import { PeopleServiceError } from "./errors";

export type PeopleTargetCollege = {
  id: string;
  organizationId: string;
};

export type PersistPersonMembershipInput = {
  identityUid: string;
  phoneE164: string;
  email?: string;
  displayName: string;
  collegeId: string;
  roles: readonly MembershipRole[];
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

export interface PeopleRepository {
  loadActiveCollege(collegeId: string): Promise<PeopleTargetCollege | null>;
  persistPersonMembership(
    input: PersistPersonMembershipInput,
  ): Promise<OnboardedPerson>;
}

export type OnboardPersonDependencies = {
  identityDirectory: IdentityDirectory;
  repository: PeopleRepository;
};

export async function onboardPerson(
  context: RequestContext,
  rawInput: unknown,
  dependencies: OnboardPersonDependencies,
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

  const identity = await resolveOrCreateIdentity(
    {
      phoneE164: input.phoneE164,
      email: input.email,
      displayName: input.displayName,
    },
    dependencies.identityDirectory,
  );

  return dependencies.repository.persistPersonMembership({
    identityUid: identity.uid,
    phoneE164: input.phoneE164,
    email: input.email,
    displayName: input.displayName,
    collegeId: college.id,
    roles: input.roles,
  });
}
