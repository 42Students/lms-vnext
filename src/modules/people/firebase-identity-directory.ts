import "server-only";

import type { UserRecord } from "firebase-admin/auth";
import { getIdentityAdminAuth } from "@/auth/firebase-admin";
import {
  IdentityDirectoryConflictError,
  type IdentityDirectory,
  type IdentityDirectoryUser,
} from "./identity";

function toDirectoryUser(user: UserRecord): IdentityDirectoryUser {
  return {
    uid: user.uid,
    phoneNumber: user.phoneNumber ?? null,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
  };
}

function authErrorCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

function isIdentityConflict(error: unknown) {
  const code = authErrorCode(error);
  return (
    code === "auth/email-already-exists" ||
    code === "auth/phone-number-already-exists" ||
    code === "auth/uid-already-exists"
  );
}

async function findUser(
  lookup: () => Promise<UserRecord>,
): Promise<IdentityDirectoryUser | null> {
  try {
    return toDirectoryUser(await lookup());
  } catch (error) {
    if (authErrorCode(error) === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

export const firebaseIdentityDirectory: IdentityDirectory = {
  findByPhone(phoneNumber) {
    return findUser(() =>
      getIdentityAdminAuth().getUserByPhoneNumber(phoneNumber),
    );
  },

  findByEmail(email) {
    return findUser(() => getIdentityAdminAuth().getUserByEmail(email));
  },

  async createUser(input) {
    try {
      const user = await getIdentityAdminAuth().createUser({
        phoneNumber: input.phoneNumber,
        email: input.email,
        displayName: input.displayName,
      });
      return toDirectoryUser(user);
    } catch (error) {
      if (isIdentityConflict(error)) {
        throw new IdentityDirectoryConflictError();
      }
      throw error;
    }
  },

  async updateUser(uid, input) {
    try {
      const user = await getIdentityAdminAuth().updateUser(uid, input);
      return toDirectoryUser(user);
    } catch (error) {
      if (isIdentityConflict(error)) {
        throw new IdentityDirectoryConflictError();
      }
      throw error;
    }
  },
};
