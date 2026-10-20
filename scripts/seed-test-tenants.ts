/**
 * Seeds a self-contained multi-college TEST scenario for the development
 * environment: one organization, two colleges with verified college hosts,
 * and one account for every role in each college.
 *
 * All contacts are fictitious (.test emails, 9100061xxx phones). They are
 * meant to be listed in AUTH_TEST_PHONES / AUTH_TEST_EMAILS, which only take
 * effect when APP_ENV=development, so no SMS or email is ever sent for them.
 *
 * Idempotent. Refuses to run unless explicitly acknowledged:
 *   ALLOW_TEST_SEED=I_ACCEPT DATABASE_URL=... tsx scripts/seed-test-tenants.ts
 */
import { Client } from "pg";

export const TEST_ORG_NAME = "42 Test Organization";
export const TEST_HOST_SUFFIX = ".development.42lms.com";

type Role = "LEARNER" | "FACULTY" | "COLLEGE_ADMIN" | "MENTOR" | "TPO";

type College = { key: "a" | "b"; name: string; code: string };

export const TEST_COLLEGES: College[] = [
  { key: "a", name: "Test College Alpha", code: "TESTA" },
  { key: "b", name: "Test College Beta", code: "TESTB" },
];

export const collegeHost = (college: College) =>
  `test${college.key}${TEST_HOST_SUFFIX}`;

type Account = {
  label: string;
  phone: string;
  email: string;
  name: string;
  /** collegeKey -> roles. Empty for platform-only people. */
  memberships: Partial<Record<"a" | "b", Role[]>>;
  superAdmin?: boolean;
  recruiter?: boolean;
};

const per = (
  key: "a" | "b",
  base: number,
): Account[] => [
  {
    label: `Learner ${key.toUpperCase()}`,
    phone: `+91910006${base + 1}`,
    email: `learner.${key}@vnext.test`,
    name: `Test Learner ${key.toUpperCase()}`,
    memberships: { [key]: ["LEARNER"] },
  },
  {
    label: `Faculty ${key.toUpperCase()}`,
    phone: `+91910006${base + 2}`,
    email: `faculty.${key}@vnext.test`,
    name: `Test Faculty ${key.toUpperCase()}`,
    memberships: { [key]: ["FACULTY"] },
  },
  {
    label: `Mentor ${key.toUpperCase()}`,
    phone: `+91910006${base + 3}`,
    email: `mentor.${key}@vnext.test`,
    name: `Test Mentor ${key.toUpperCase()}`,
    memberships: { [key]: ["FACULTY", "MENTOR"] },
  },
  {
    label: `College Admin ${key.toUpperCase()}`,
    phone: `+91910006${base + 4}`,
    email: `admin.${key}@vnext.test`,
    name: `Test College Admin ${key.toUpperCase()}`,
    memberships: { [key]: ["COLLEGE_ADMIN"] },
  },
  {
    label: `TPO ${key.toUpperCase()}`,
    phone: `+91910006${base + 5}`,
    email: `tpo.${key}@vnext.test`,
    name: `Test TPO ${key.toUpperCase()}`,
    memberships: { [key]: ["TPO"] },
  },
];

export const TEST_ACCOUNTS: Account[] = [
  {
    label: "Super Admin",
    phone: "+919100061000",
    email: "superadmin@vnext.test",
    name: "Test Super Admin",
    memberships: {},
    superAdmin: true,
  },
  ...per("a", 1100),
  ...per("b", 1200),
  {
    label: "HR / Recruiter (both colleges)",
    phone: "+919100061301",
    email: "hr@vnext.test",
    name: "Test Recruiter",
    memberships: {},
    recruiter: true,
  },
  {
    label: "Shared Faculty (both colleges)",
    phone: "+919100061401",
    email: "faculty.shared@vnext.test",
    name: "Test Shared Faculty",
    memberships: { a: ["FACULTY"], b: ["FACULTY"] },
  },
];

export function testContactLists() {
  return {
    phones: TEST_ACCOUNTS.map((account) => account.phone).join(","),
    emails: TEST_ACCOUNTS.map((account) => account.email).join(","),
  };
}

async function one<T = Record<string, unknown>>(
  client: Client,
  text: string,
  values: unknown[] = [],
) {
  const result = await client.query(text, values);
  return (result.rows[0] as T | undefined) ?? null;
}

async function main() {
  if (process.env.ALLOW_TEST_SEED !== "I_ACCEPT") {
    throw new Error(
      "Refusing to seed test tenants: set ALLOW_TEST_SEED=I_ACCEPT",
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("BEGIN");

    const org =
      (await one<{ id: string }>(
        client,
        `SELECT id FROM organizations WHERE lower(name) = lower($1) AND status = 'ACTIVE'`,
        [TEST_ORG_NAME],
      )) ??
      (await one<{ id: string }>(
        client,
        `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
        [TEST_ORG_NAME],
      ))!;

    const collegeIds: Record<string, string> = {};
    for (const college of TEST_COLLEGES) {
      const row =
        (await one<{ id: string }>(
          client,
          `SELECT id FROM colleges WHERE lower(code) = lower($1)`,
          [college.code],
        )) ??
        (await one<{ id: string }>(
          client,
          `INSERT INTO colleges (organization_id, name, code, city, state, country)
           VALUES ($1, $2, $3, 'Test City', 'Test State', 'India') RETURNING id`,
          [org.id, college.name, college.code],
        ))!;
      collegeIds[college.key] = row.id;

      const hasDept = await one(
        client,
        `SELECT 1 FROM departments WHERE college_id = $1 AND archived_at IS NULL AND lower(name) = 'computer science'`,
        [row.id],
      );
      if (!hasDept) {
        await client.query(
          `INSERT INTO departments (college_id, name) VALUES ($1, 'Computer Science')`,
          [row.id],
        );
      }

      const host = collegeHost(college);
      const hasDomain = await one(
        client,
        `SELECT 1 FROM tenant_domains WHERE lower(host) = $1`,
        [host],
      );
      if (!hasDomain) {
        await client.query(
          `INSERT INTO tenant_domains
             (college_id, host, is_primary, is_verified, verified_at, last_checked_at, last_check_result)
           VALUES ($1, $2, true, true, now(), now(), 'VERIFIED')`,
          [row.id, host],
        );
      }
    }

    const userIds: Record<string, string> = {};
    for (const account of TEST_ACCOUNTS) {
      const existing = await one<{ id: string }>(
        client,
        `SELECT id FROM users WHERE phone_e164 = $1 OR lower(email) = $2 LIMIT 1`,
        [account.phone, account.email],
      );
      const user =
        existing ??
        (await one<{ id: string }>(
          client,
          `INSERT INTO users (identity_uid, phone_e164, email, display_name)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            `lms_test_${account.phone.replace(/\D/g, "")}`,
            account.phone,
            account.email,
            account.name,
          ],
        ))!;
      userIds[account.email] = user.id;

      if (account.superAdmin) {
        await client.query(
          `INSERT INTO system_roles (user_id, role) VALUES ($1, 'SUPER_ADMIN')
           ON CONFLICT DO NOTHING`,
          [user.id],
        );
      }

      for (const [key, roles] of Object.entries(account.memberships)) {
        const collegeId = collegeIds[key];
        const membership =
          (await one<{ id: string }>(
            client,
            `SELECT id FROM college_memberships WHERE user_id = $1 AND college_id = $2`,
            [user.id, collegeId],
          )) ??
          (await one<{ id: string }>(
            client,
            `INSERT INTO college_memberships (user_id, college_id) VALUES ($1, $2) RETURNING id`,
            [user.id, collegeId],
          ))!;

        for (const role of roles ?? []) {
          await client.query(
            `INSERT INTO membership_roles (membership_id, role) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [membership.id, role],
          );
        }

        if (roles?.includes("LEARNER")) {
          await client.query(
            `INSERT INTO learner_profiles (membership_id, roll_number)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [membership.id, `${key.toUpperCase()}-TEST-001`],
          );
        }
        if (roles?.includes("FACULTY")) {
          const dept = await one<{ id: string }>(
            client,
            `SELECT id FROM departments WHERE college_id = $1 AND archived_at IS NULL LIMIT 1`,
            [collegeId],
          );
          await client.query(
            `INSERT INTO faculty_profiles (membership_id, primary_department_id, employment_type, academic_title)
             VALUES ($1, $2, 'FULL_TIME', 'Assistant Professor') ON CONFLICT DO NOTHING`,
            [membership.id, dept?.id ?? null],
          );
        }
      }
    }

    // One recruiter with access to both colleges (HR is not a membership).
    const adminId = userIds["superadmin@vnext.test"];
    const recruiterId = userIds["hr@vnext.test"];
    const company =
      (await one<{ id: string }>(
        client,
        `SELECT id FROM placement_companies WHERE lower(name) = 'acme hiring test co'`,
      )) ??
      (await one<{ id: string }>(
        client,
        `INSERT INTO placement_companies (name, primary_domain, created_by_user_id)
         VALUES ('Acme Hiring Test Co', 'acme-hiring.test', $1) RETURNING id`,
        [adminId],
      ))!;
    await client.query(
      `INSERT INTO placement_recruiter_profiles (user_id, company_id, title, created_by_user_id)
       VALUES ($1, $2, 'Talent Partner', $3) ON CONFLICT DO NOTHING`,
      [recruiterId, company.id, adminId],
    );
    for (const college of TEST_COLLEGES) {
      const relationship =
        (await one<{ id: string }>(
          client,
          `SELECT id FROM placement_company_relationships WHERE college_id = $1 AND company_id = $2`,
          [collegeIds[college.key], company.id],
        )) ??
        (await one<{ id: string }>(
          client,
          `INSERT INTO placement_company_relationships (college_id, company_id, created_by_user_id)
           VALUES ($1, $2, $3) RETURNING id`,
          [collegeIds[college.key], company.id, adminId],
        ))!;
      const hasGrant = await one(
        client,
        `SELECT 1 FROM placement_recruiter_college_grants
         WHERE recruiter_user_id = $1 AND company_relationship_id = $2 AND status = 'ACTIVE'`,
        [recruiterId, relationship.id],
      );
      if (!hasGrant) {
        await client.query(
          `INSERT INTO placement_recruiter_college_grants
             (recruiter_user_id, company_relationship_id, granted_by_user_id)
           VALUES ($1, $2, $3)`,
          [recruiterId, relationship.id, adminId],
        );
      }
    }

    await client.query("COMMIT");
    console.log(
      `Seeded ${TEST_ACCOUNTS.length} test accounts across ${TEST_COLLEGES.length} colleges.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && /seed-test-tenants/.test(process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
