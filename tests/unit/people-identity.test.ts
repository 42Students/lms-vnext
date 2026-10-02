import { describe, expect, it } from "vitest";
import {
  resolveOrCreateIdentity,
  type IdentityDirectory,
  type IdentityDirectoryCreateInput,
  type IdentityDirectoryUpdateInput,
  type IdentityDirectoryUser,
} from "@/modules/people/identity";
import { PeopleServiceError } from "@/modules/people/errors";

class FakeIdentityDirectory implements IdentityDirectory {
  private users = new Map<string, IdentityDirectoryUser>();
  createCount = 0;

  constructor(initialUsers: IdentityDirectoryUser[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.uid, { ...user });
    }
  }

  async findByPhone(phoneNumber: string) {
    return (
      [...this.users.values()].find(
        (user) => user.phoneNumber === phoneNumber,
      ) ?? null
    );
  }

  async findByEmail(email: string) {
    const normalized = email.toLowerCase();
    return (
      [...this.users.values()].find(
        (user) => user.email?.toLowerCase() === normalized,
      ) ?? null
    );
  }

  async createUser(input: IdentityDirectoryCreateInput) {
    this.createCount += 1;
    const user: IdentityDirectoryUser = {
      uid: `uid-${this.createCount}`,
      phoneNumber: input.phoneNumber,
      email: input.email ?? null,
      displayName: input.displayName,
    };
    this.users.set(user.uid, user);
    return { ...user };
  }

  async updateUser(
    uid: string,
    input: IdentityDirectoryUpdateInput,
  ) {
    const current = this.users.get(uid);
    if (!current) throw new Error("missing fake user");

    const updated = {
      ...current,
      ...input,
    };
    this.users.set(uid, updated);
    return { ...updated };
  }
}

describe("people identity resolution", () => {
  it("creates one identity and reuses it on repeat onboarding", async () => {
    const directory = new FakeIdentityDirectory();
    const input = {
      phoneE164: "+919397662127",
      email: "phani@example.com",
      displayName: "Phanindra",
    };

    const first = await resolveOrCreateIdentity(input, directory);
    const second = await resolveOrCreateIdentity(input, directory);

    expect(first.uid).toBe(second.uid);
    expect(directory.createCount).toBe(1);
  });

  it("safely fills a missing email on an existing phone identity", async () => {
    const directory = new FakeIdentityDirectory([
      {
        uid: "uid-existing",
        phoneNumber: "+919397662127",
        email: null,
        displayName: "Old Name",
      },
    ]);

    const resolved = await resolveOrCreateIdentity(
      {
        phoneE164: "+919397662127",
        email: "phani@example.com",
        displayName: "Phanindra",
      },
      directory,
    );

    expect(resolved).toMatchObject({
      uid: "uid-existing",
      email: "phani@example.com",
      displayName: "Phanindra",
    });
  });

  it("blocks ambiguous phone and email identities instead of merging them", async () => {
    const directory = new FakeIdentityDirectory([
      {
        uid: "uid-phone",
        phoneNumber: "+919397662127",
        email: null,
        displayName: "Phone Person",
      },
      {
        uid: "uid-email",
        phoneNumber: "+919999999999",
        email: "phani@example.com",
        displayName: "Email Person",
      },
    ]);

    await expect(
      resolveOrCreateIdentity(
        {
          phoneE164: "+919397662127",
          email: "phani@example.com",
          displayName: "Phanindra",
        },
        directory,
      ),
    ).rejects.toMatchObject<Partial<PeopleServiceError>>({
      code: "IDENTITY_COLLISION",
    });
  });
});
