import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import {
  SYSTEM_ROLES,
  type SystemRole,
  type UserPlatformStatus,
} from "@/modules/identity/constants";
import { requirePermission } from "@/modules/permissions/policy";
import { PeopleServiceError } from "@/modules/people/errors";
import {
  resolveOrCreateIdentity,
  type IdentityDirectory,
} from "@/modules/people/identity";
import {
  personDisplayNameSchema,
  personEmailSchema,
  phoneE164Schema,
} from "@/modules/people/validation";

export const bootstrapSuperAdminInputSchema = z.object({
  phoneE164: phoneE164Schema,
  email: personEmailSchema.optional(),
  displayName: personDisplayNameSchema,
}).strict();

export const assignSystemRoleInputSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(SYSTEM_ROLES),
}).strict();

export type BootstrapSuperAdminInput = z.infer<
  typeof bootstrapSuperAdminInputSchema
>;

export type SystemRoleUserView = {
  id: string;
  identityUid: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
  platformStatus: UserPlatformStatus;
  systemRoles: SystemRole[];
};

export type PersistBootstrapUserInput = {
  identityUid: string;
  phoneE164: string;
  email?: string;
  displayName: string;
};

export interface SystemRoleRepository {
  persistBootstrapUser(
    input: PersistBootstrapUserInput,
  ): Promise<SystemRoleUserView>;
  loadUser(
    userId: string,
  ): Promise<{ id: string; platformStatus: UserPlatformStatus } | null>;
  assignRole(userId: string, role: SystemRole, context: RequestContext): Promise<SystemRole[]>;
}

export type SystemRoleServiceErrorCode =
  | "IDENTITY_COLLISION"
  | "USER_NOT_FOUND"
  | "USER_DISABLED";

export class SystemRoleServiceError extends Error {
  constructor(public readonly code: SystemRoleServiceErrorCode) {
    super(code);
    this.name = "SystemRoleServiceError";
  }
}

export async function bootstrapSuperAdmin(
  rawInput: unknown,
  dependencies: {
    identityDirectory: IdentityDirectory;
    repository: SystemRoleRepository;
  },
) {
  const input = bootstrapSuperAdminInputSchema.parse(rawInput);

  let identity;
  try {
    identity = await resolveOrCreateIdentity(
      {
        phoneE164: input.phoneE164,
        ...(input.email !== undefined ? { email: input.email } : {}),
        displayName: input.displayName,
      },
      dependencies.identityDirectory,
    );
  } catch (error) {
    if (
      error instanceof PeopleServiceError &&
      error.code === "IDENTITY_COLLISION"
    ) {
      throw new SystemRoleServiceError("IDENTITY_COLLISION");
    }
    throw error;
  }

  return dependencies.repository.persistBootstrapUser({
    identityUid: identity.uid,
    phoneE164: input.phoneE164,
    ...((input.email ?? identity.email) !== undefined ? { email: input.email ?? identity.email } : {}),
    displayName: input.displayName,
  });
}

export async function assignSystemRole(
  context: RequestContext,
  rawInput: unknown,
  repository: SystemRoleRepository,
) {
  const input = assignSystemRoleInputSchema.parse(rawInput);

  requirePermission(context, "system-role.manage");

  const user = await repository.loadUser(input.userId);
  if (!user) {
    throw new SystemRoleServiceError("USER_NOT_FOUND");
  }
  if (user.platformStatus !== "ACTIVE") {
    throw new SystemRoleServiceError("USER_DISABLED");
  }

  return repository.assignRole(user.id, input.role, context);
}
