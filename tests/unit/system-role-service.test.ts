import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import type { IdentityDirectory } from "@/modules/people/identity";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  assignSystemRole,
  bootstrapSuperAdmin,
  type PersistBootstrapUserInput,
  type SystemRoleRepository,
  type SystemRoleUserView,
} from "@/modules/system-roles/service";

function createIdentityDirectory(): {
  directory: IdentityDirectory;
  createCount: () => number;
} {
  const users = new Map<
    string,
    {
      uid: string;
      phoneNumber: string | null;
      email: string | null;
      displayName: string | null;
    }
  >();
  let count = 0;

  return {
    createCount: () => count,
    directory: {
      async findByPhone(phoneNumber) {
        return (
          [...users.values()].find(
            (user) => user.phoneNumber === phoneNumber,
          ) ?? null
        );
      },
      async findByEmail(email) {
        return (
          [...users.values()].find(
            (user) => user.email?.toLowerCase() === email.toLowerCase(),
          ) ?? null
        );
      },
      async createUser(input) {
        count += 1;
        const user = {
          uid: `identity-${count}`,
          phoneNumber: input.phoneNumber,
          email: input.email ?? null,
          displayName: input.displayName,
        };
        users.set(user.uid, user);
        return user;
      },
      async updateUser(uid, input) {
        const current = users.get(uid);
        if (!current) {
          throw new Error("missing identity");
        }
        const updated = {
          ...current,
          phoneNumber: input.phoneNumber ?? current.phoneNumber,
          email: input.email ?? current.email,
          displayName: input.displayName ?? current.displayName,
        };
        users.set(uid, updated);
        return updated;
      },
    },
  };
}

function createRepository(): SystemRoleRepository {
  let stored: SystemRoleUserView | null = null;

  return {
    async persistBootstrapUser(
      input: PersistBootstrapUserInput,
    ): Promise<SystemRoleUserView> {
      stored = {
        id: stored?.id ?? "11111111-1111-4111-8111-111111111111",
        identityUid: input.identityUid,
        phoneE164: input.phoneE164,
        email: input.email ?? null,
        displayName: input.displayName,
        platformStatus: "ACTIVE",
        systemRoles: ["SUPER_ADMIN"],
      };
      return stored;
    },
    async loadUser(userId) {
      if (userId !== "11111111-1111-4111-8111-111111111111") {
        return null;
      }
      return { id: userId, platformStatus: "ACTIVE" };
    },
    async assignRole(_userId, role) {
      return [role];
    },
  };
}

const superAdminContext: RequestContext = {
  user: {
    id: "super-user",
    identityUid: "super-identity",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
};

describe("SUPER_ADMIN bootstrap and administration", () => {
  it("creates the Identity Platform identity once and is safe to repeat", async () => {
    const identity = createIdentityDirectory();
    const repository = createRepository();

    const input = {
      phoneE164: "+91 98765-43210",
      email: " ADMIN@EXAMPLE.COM ",
      displayName: " Platform Admin ",
    };

    const first = await bootstrapSuperAdmin(input, {
      identityDirectory: identity.directory,
      repository,
    });
    const second = await bootstrapSuperAdmin(input, {
      identityDirectory: identity.directory,
      repository,
    });

    expect(identity.createCount()).toBe(1);
    expect(first.id).toBe(second.id);
    expect(second.phoneE164).toBe("+919876543210");
    expect(second.email).toBe("admin@example.com");
    expect(second.displayName).toBe("Platform Admin");
    expect(second.systemRoles).toEqual(["SUPER_ADMIN"]);
  });

  it("allows unscoped SUPER_ADMIN assignment but denies selected-scope elevation", async () => {
    const repository = createRepository();
    const userId = "11111111-1111-4111-8111-111111111111";

    await expect(
      assignSystemRole(
        superAdminContext,
        { userId, role: "SUPER_ADMIN" },
        repository,
      ),
    ).resolves.toEqual(["SUPER_ADMIN"]);

    await expect(
      assignSystemRole(
        {
          ...superAdminContext,
          adminScope: {
            organizationId: "org-1",
            collegeId: "college-1",
          },
        },
        { userId, role: "SUPER_ADMIN" },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("does not allow a college admin to assign a system role", async () => {
    const repository = createRepository();
    const collegeAdmin: RequestContext = {
      user: {
        id: "college-admin",
        identityUid: "identity-admin",
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: "membership-1",
        collegeId: "college-1",
        organizationId: "org-1",
        status: "ACTIVE",
        roles: ["COLLEGE_ADMIN"],
      },
    };

    await expect(
      assignSystemRole(
        collegeAdmin,
        {
          userId: "11111111-1111-4111-8111-111111111111",
          role: "SUPER_ADMIN",
        },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("fails closed when the target user does not exist", async () => {
    const repository = createRepository();

    await expect(
      assignSystemRole(
        superAdminContext,
        {
          userId: "22222222-2222-4222-8222-222222222222",
          role: "SUPER_ADMIN",
        },
        repository,
      ),
    ).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });
});
