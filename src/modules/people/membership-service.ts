import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PeopleServiceError } from "./errors";
import {assertMutableMembershipTarget} from "./membership-protection";
import type { PersonMembershipView } from "./service";
import {
  membershipLifecycleInputSchema,
  membershipRoleMutationInputSchema,
  personMembershipIdSchema,
  type MembershipLifecycleInput,
} from "./validation";

export type MembershipMutationContext = {
  context: RequestContext;
  person: PersonMembershipView;
};

export interface MembershipManagementRepository {
  loadMembershipDetail(
    membershipId: string,
  ): Promise<PersonMembershipView | null>;
  addMembershipRole(
    membershipId: string,
    role: MembershipRole,
    mutation: MembershipMutationContext,
  ): Promise<MembershipRole[]>;
  removeMembershipRole(
    membershipId: string,
    role: MembershipRole,
    mutation: MembershipMutationContext,
  ): Promise<MembershipRole[]>;
  transitionMembershipLifecycle(
    membershipId: string,
    input: MembershipLifecycleInput,
    mutation: MembershipMutationContext,
  ): Promise<PersonMembershipView>;
}

async function loadAuthorizedMembership(
  context: RequestContext,
  membershipIdInput: string,
  permission: "membership.role.manage" | "membership.lifecycle.manage",
  repository: MembershipManagementRepository,
) {
  const membershipId = personMembershipIdSchema.parse(membershipIdInput);
  const person = await repository.loadMembershipDetail(membershipId);

  if (!person) {
    throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
  }

  requirePermission(context, permission, {
    organizationId: person.organizationId,
    collegeId: person.membership.collegeId,
  });

  return person;
}

function requireMutableRoleMembership(person: PersonMembershipView) {
  if (person.membership.status === "ENDED") {
    throw new PeopleServiceError("MEMBERSHIP_ENDED");
  }
}

export async function listMembershipRoles(
  context: RequestContext,
  membershipIdInput: string,
  repository: MembershipManagementRepository,
) {
  const person = await loadAuthorizedMembership(
    context,
    membershipIdInput,
    "membership.role.manage",
    repository,
  );

  return person.membership.roles;
}

export async function addMembershipRole(
  context: RequestContext,
  membershipIdInput: string,
  rawInput: unknown,
  repository: MembershipManagementRepository,
) {
  const input = membershipRoleMutationInputSchema.parse(rawInput);
  // COL-people-20: only Super Admins can grant/revoke COLLEGE_ADMIN.
  if (input.role === "COLLEGE_ADMIN") {
    requirePermission(context, "admin-scope.select");
  }
  const person = await loadAuthorizedMembership(
    context,
    membershipIdInput,
    "membership.role.manage",
    repository,
  );
  requireMutableRoleMembership(person);
  assertMutableMembershipTarget(context,{userId:person.user.id,roles:person.membership.roles},"ROLE_ADD",input.role);

  return repository.addMembershipRole(
    person.membership.id,
    input.role,
    { context, person },
  );
}

export async function removeMembershipRole(
  context: RequestContext,
  membershipIdInput: string,
  rawInput: unknown,
  repository: MembershipManagementRepository,
) {
  const input = membershipRoleMutationInputSchema.parse(rawInput);
  // COL-people-20: only Super Admins can grant/revoke COLLEGE_ADMIN.
  if (input.role === "COLLEGE_ADMIN") {
    requirePermission(context, "admin-scope.select");
  }
  const person = await loadAuthorizedMembership(
    context,
    membershipIdInput,
    "membership.role.manage",
    repository,
  );
  requireMutableRoleMembership(person);
  assertMutableMembershipTarget(context,{userId:person.user.id,roles:person.membership.roles},"ROLE_REMOVE",input.role);

  return repository.removeMembershipRole(
    person.membership.id,
    input.role,
    { context, person },
  );
}

export async function updateMembershipLifecycle(
  context: RequestContext,
  membershipIdInput: string,
  rawInput: unknown,
  repository: MembershipManagementRepository,
) {
  const input = membershipLifecycleInputSchema.parse(rawInput);
  const person = await loadAuthorizedMembership(
    context,
    membershipIdInput,
    "membership.lifecycle.manage",
    repository,
  );

  assertMutableMembershipTarget(context,{userId:person.user.id,roles:person.membership.roles},input.action);

  return repository.transitionMembershipLifecycle(
    person.membership.id,
    input,
    { context, person },
  );
}
