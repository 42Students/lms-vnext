import { MEMBERSHIP_ROLE_LABELS, type MembershipRole } from "@/modules/identity/constants";
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

/** Distinguish the human-facing role from the immutable stored enum. */
export function membershipRoleHumanLabel(role:MembershipRole):string {
 return MEMBERSHIP_ROLE_LABELS[role];
}
export const MEMBERSHIP_TRANSITION_STATUS_COPY={
 SUSPEND:"Membership suspended for the selected college.",
 REACTIVATE:"Membership reactivated for the selected college.",
 END:"Membership ended for the selected college. The platform account was not deleted.",
} as const;

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
  // Legacy ADMIN and TPO are protected faculty types: never allow a college
  // operator to grant or revoke either privileged role via a generic role edit.
  if (input.role === "COLLEGE_ADMIN" || input.role === "TPO") {
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
  // Legacy ADMIN and TPO are protected faculty types: never allow a college
  // operator to grant or revoke either privileged role via a generic role edit.
  if (input.role === "COLLEGE_ADMIN" || input.role === "TPO") {
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

  // A membership lifecycle transition is scoped to this college membership.
  // It is NOT a platform-wide user disable: global sign-in revocation must use
  // the separate platform-status/session-revocation workflow.
  const updated = await repository.transitionMembershipLifecycle(
    person.membership.id,
    input,
    { context, person },
  );
  return { ...updated, lifecycleScope: "COLLEGE_MEMBERSHIP" as const,
   userId:person.user.id, collegeId:person.membership.collegeId,
   roles:updated.membership.roles,
   transitionMessage:MEMBERSHIP_TRANSITION_STATUS_COPY[input.action],
   // The current user remains a platform identity even when this membership
   // ends; client must refresh scoped role views rather than a deleted-user flag.
   refreshView:"MEMBERSHIP_DETAIL" as const };

}
