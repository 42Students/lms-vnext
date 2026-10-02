import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { firebaseIdentityDirectory } from "./firebase-identity-directory";
import {
  addMembershipRole,
  listMembershipRoles,
  removeMembershipRole,
  updateMembershipLifecycle,
} from "./membership-service";
import { drizzleProfileRepository } from "./profile-repository";
import {
  getFacultyProfile,
  getLearnerProfile,
  upsertFacultyProfile,
  upsertLearnerProfile,
} from "./profile-service";
import { drizzlePeopleRepository } from "./repository";
import {
  getPersonMembershipDetail,
  listCollegePeople,
  onboardPerson,
} from "./service";

export function onboardPersonWithRuntime(
  context: RequestContext,
  rawInput: unknown,
) {
  return onboardPerson(context, rawInput, {
    identityDirectory: firebaseIdentityDirectory,
    repository: drizzlePeopleRepository,
  });
}

export function listCollegePeopleWithRuntime(
  context: RequestContext,
  rawQuery: unknown,
) {
  return listCollegePeople(context, rawQuery, drizzlePeopleRepository);
}

export function getPersonMembershipDetailWithRuntime(
  context: RequestContext,
  membershipId: string,
) {
  return getPersonMembershipDetail(
    context,
    membershipId,
    drizzlePeopleRepository,
  );
}

export function listMembershipRolesWithRuntime(
  context: RequestContext,
  membershipId: string,
) {
  return listMembershipRoles(
    context,
    membershipId,
    drizzlePeopleRepository,
  );
}

export function addMembershipRoleWithRuntime(
  context: RequestContext,
  membershipId: string,
  rawInput: unknown,
) {
  return addMembershipRole(
    context,
    membershipId,
    rawInput,
    drizzlePeopleRepository,
  );
}

export function removeMembershipRoleWithRuntime(
  context: RequestContext,
  membershipId: string,
  rawInput: unknown,
) {
  return removeMembershipRole(
    context,
    membershipId,
    rawInput,
    drizzlePeopleRepository,
  );
}

export function updateMembershipLifecycleWithRuntime(
  context: RequestContext,
  membershipId: string,
  rawInput: unknown,
) {
  return updateMembershipLifecycle(
    context,
    membershipId,
    rawInput,
    drizzlePeopleRepository,
  );
}

export function getLearnerProfileWithRuntime(
  context: RequestContext,
  membershipId: string,
) {
  return getLearnerProfile(
    context,
    membershipId,
    drizzleProfileRepository,
  );
}

export function upsertLearnerProfileWithRuntime(
  context: RequestContext,
  membershipId: string,
  rawInput: unknown,
) {
  return upsertLearnerProfile(
    context,
    membershipId,
    rawInput,
    drizzleProfileRepository,
  );
}

export function getFacultyProfileWithRuntime(
  context: RequestContext,
  membershipId: string,
) {
  return getFacultyProfile(
    context,
    membershipId,
    drizzleProfileRepository,
  );
}

export function upsertFacultyProfileWithRuntime(
  context: RequestContext,
  membershipId: string,
  rawInput: unknown,
) {
  return upsertFacultyProfile(
    context,
    membershipId,
    rawInput,
    drizzleProfileRepository,
  );
}
