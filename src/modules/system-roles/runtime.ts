import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { localIdentityDirectory } from "@/modules/people/local-identity-directory";
import { drizzleSystemRoleRepository } from "./repository";
import {
  assignSystemRole,
  bootstrapSuperAdmin,
} from "./service";

export function bootstrapSuperAdminWithRuntime(rawInput: unknown) {
  return bootstrapSuperAdmin(rawInput, {
    identityDirectory: localIdentityDirectory,
    repository: drizzleSystemRoleRepository,
  });
}

export function assignSystemRoleWithRuntime(
  context: RequestContext,
  rawInput: unknown,
) {
  return assignSystemRole(context, rawInput, drizzleSystemRoleRepository);
}
