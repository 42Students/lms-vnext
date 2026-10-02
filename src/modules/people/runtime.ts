import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { firebaseIdentityDirectory } from "./firebase-identity-directory";
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
