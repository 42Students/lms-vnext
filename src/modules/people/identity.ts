import { PeopleServiceError } from "./errors";

export type IdentityDirectoryUser = {
  uid: string;
  phoneNumber: string | null;
  email: string | null;
  displayName: string | null;
};

export type IdentityDirectoryCreateInput = {
  phoneNumber: string;
  email?: string;
  displayName: string;
};

export type IdentityDirectoryUpdateInput = {
  phoneNumber?: string;
  email?: string;
  displayName?: string;
};

export interface IdentityDirectory {
  findByPhone(phoneNumber: string): Promise<IdentityDirectoryUser | null>;
  findByEmail(email: string): Promise<IdentityDirectoryUser | null>;
  createUser(
    input: IdentityDirectoryCreateInput,
  ): Promise<IdentityDirectoryUser>;
  updateUser(
    uid: string,
    input: IdentityDirectoryUpdateInput,
  ): Promise<IdentityDirectoryUser>;
}

export class IdentityDirectoryConflictError extends Error {
  constructor() {
    super("IDENTITY_DIRECTORY_CONFLICT");
    this.name = "IdentityDirectoryConflictError";
  }
}

export type ResolveIdentityInput = {
  phoneE164: string;
  email?: string;
  displayName: string;
};

function normalizedEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

function assertCompatibleIdentity(
  user: IdentityDirectoryUser,
  input: ResolveIdentityInput,
) {
  if (user.phoneNumber && user.phoneNumber !== input.phoneE164) {
    throw new PeopleServiceError("IDENTITY_COLLISION");
  }

  if (
    input.email &&
    user.email &&
    normalizedEmail(user.email) !== normalizedEmail(input.email)
  ) {
    throw new PeopleServiceError("IDENTITY_COLLISION");
  }
}

async function findExistingIdentity(
  input: ResolveIdentityInput,
  directory: IdentityDirectory,
) {
  const [byPhone, byEmail] = await Promise.all([
    directory.findByPhone(input.phoneE164),
    input.email ? directory.findByEmail(input.email) : Promise.resolve(null),
  ]);

  if (byPhone && byEmail && byPhone.uid !== byEmail.uid) {
    throw new PeopleServiceError("IDENTITY_COLLISION");
  }

  const existing = byPhone ?? byEmail;
  if (!existing) return null;

  assertCompatibleIdentity(existing, input);
  return existing;
}

async function synchronizeIdentity(
  existing: IdentityDirectoryUser,
  input: ResolveIdentityInput,
  directory: IdentityDirectory,
) {
  const update: IdentityDirectoryUpdateInput = {};

  if (!existing.phoneNumber) {
    update.phoneNumber = input.phoneE164;
  }

  if (input.email && !existing.email) {
    update.email = input.email;
  }

  if (existing.displayName !== input.displayName) {
    update.displayName = input.displayName;
  }

  if (Object.keys(update).length === 0) {
    return existing;
  }

  try {
    return await directory.updateUser(existing.uid, update);
  } catch (error) {
    if (error instanceof IdentityDirectoryConflictError) {
      throw new PeopleServiceError("IDENTITY_COLLISION");
    }
    throw error;
  }
}

export async function resolveOrCreateIdentity(
  input: ResolveIdentityInput,
  directory: IdentityDirectory,
) {
  const existing = await findExistingIdentity(input, directory);
  if (existing) {
    return synchronizeIdentity(existing, input, directory);
  }

  try {
    return await directory.createUser({
      phoneNumber: input.phoneE164,
      email: input.email,
      displayName: input.displayName,
    });
  } catch (error) {
    if (!(error instanceof IdentityDirectoryConflictError)) {
      throw error;
    }

    const racedIdentity = await findExistingIdentity(input, directory);
    if (!racedIdentity) {
      throw new PeopleServiceError("IDENTITY_COLLISION");
    }

    return synchronizeIdentity(racedIdentity, input, directory);
  }
}
