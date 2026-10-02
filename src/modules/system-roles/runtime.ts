import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { firebaseIdentityDirectory } from "@/modules/people/firebase-identity-directory";
import { drizzleSystemRoleRepository } from "./repository";
import {
  assignSystemRole,
  bootstrapSuperAdmin,
} from "./service";

export function bootstrapSuperAdminWithRuntime(rawInput: unknown) {
  return bootstrapSuperAdmin(rawInput, {
    identityDirectory: firebaseIdentityDirectory,
    repository: drizzleSystemRoleRepository,
  });
}

export function assignSystemRoleWithRuntime(
  context: RequestContext,
  rawInput: unknown,
) {
  return assignSystemRole(context, rawInput, drizzleSystemRoleRepository);
}
