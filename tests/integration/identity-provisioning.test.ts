import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import {
  closeDatabaseConnection,
} from "@/db/client";
import type {
  IdentityDirectory,
  IdentityDirectoryUser,
} from "@/modules/people/identity";
import {
  provisionPlatformIdentity,
} from "@/modules/people/identity-provisioning";
import {
  drizzleIdentityProvisioningRepository,
} from "@/modules/people/identity-provisioning-repository";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const email = "identity.provisioning@example.com";
const identityUid = "integration-email-only-recruiter";

function directory() {
  let user: IdentityDirectoryUser | null = null;
  let createCount = 0;

  const adapter: IdentityDirectory = {
    async findByPhone(phone) {
      return user?.phoneNumber === phone
        ? user
        : null;
    },
    async findByEmail(candidate) {
      return user?.email?.toLowerCase() ===
        candidate.toLowerCase()
        ? user
        : null;
    },
    async createUser(input) {
      createCount += 1;
      user = {
        uid: identityUid,
        phoneNumber:
          input.phoneNumber ?? null,
        email: input.email ?? null,
        displayName: input.displayName,
      };
      return user;
    },
    async updateUser(uid, input) {
      if (!user || uid !== user.uid) {
        throw new Error("missing identity");
      }
      user = {
        ...user,
        phoneNumber:
          input.phoneNumber ??
          user.phoneNumber,
        email: input.email ?? user.email,
        displayName:
          input.displayName ??
          user.displayName,
      };
      return user;
    },
  };

  return {
    adapter,
    createCount: () => createCount,
  };
}

async function cleanup() {
  await pool.query(
    "delete from users where identity_uid = $1 or lower(email) = lower($2)",
    [identityUid, email],
  );
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe(
  "contact-flexible identity provisioning against PostgreSQL",
  () => {
    it("creates one canonical email-only user and is idempotent", async () => {
      const identity = directory();
      const dependencies = {
        identityDirectory:
          identity.adapter,
        repository:
          drizzleIdentityProvisioningRepository,
      };

      const first =
        await provisionPlatformIdentity(
          {
            email,
            displayName:
              "Recruiter Contact",
          },
          dependencies,
        );
      const repeated =
        await provisionPlatformIdentity(
          {
            email,
            displayName:
              "Recruiter Contact",
          },
          dependencies,
        );

      expect(first).toMatchObject({
        identityUid,
        existed: false,
        platformStatus: "ACTIVE",
      });
      expect(repeated).toMatchObject({
        userId: first.userId,
        identityUid,
        existed: true,
        platformStatus: "ACTIVE",
      });
      expect(identity.createCount()).toBe(1);

      const rows = await pool.query(
        `select identity_uid, phone_e164, email, platform_status
           from users
          where identity_uid = $1`,
        [identityUid],
      );
      expect(rows.rows).toEqual([
        expect.objectContaining({
          identity_uid: identityUid,
          phone_e164: null,
          email,
          platform_status: "ACTIVE",
        }),
      ]);
    });

    it("never reactivates a disabled existing user", async () => {
      const identity = directory();
      const dependencies = {
        identityDirectory:
          identity.adapter,
        repository:
          drizzleIdentityProvisioningRepository,
      };

      const first =
        await provisionPlatformIdentity(
          {
            email,
            displayName:
              "Recruiter Contact",
          },
          dependencies,
        );

      await pool.query(
        `update users
            set platform_status = 'DISABLED'
          where id = $1`,
        [first.userId],
      );

      const repeated =
        await provisionPlatformIdentity(
          {
            email,
            displayName:
              "Recruiter Contact",
          },
          dependencies,
        );

      expect(repeated).toMatchObject({
        userId: first.userId,
        existed: true,
        platformStatus: "DISABLED",
      });
    });
  },
);
