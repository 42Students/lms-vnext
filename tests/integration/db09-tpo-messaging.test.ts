import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { resolveRequestContext } from "@/modules/identity/context-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  grantPlacementRecruiter,
  revokePlacementRecruiterGrant,
} from "@/modules/placements/recruiter-service";
import {
  listThreadMessages,
  openRecruiterMessageThread,
  openTpoMessageThread,
  sendThreadMessage,
} from "@/modules/placements/tpo-messaging-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

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

const recruiterUserId =
  "69000000-0000-4000-8000-000000000001";

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

const tpoB: RequestContext = {
  user: tpo.user,
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

async function cleanup() {
  if (process.env.DB09_COLLABORATION_MIGRATION_APPLIED === "1") {
    await pool.query("delete from placement_tpo_messages");
    await pool.query("delete from placement_tpo_message_threads");
  }
  await pool.query(
    "delete from placement_recruiter_college_grants where recruiter_user_id = $1",
    [recruiterUserId],
  );
  await pool.query(
    "delete from placement_recruiter_profiles where user_id = $1",
    [recruiterUserId],
  );
  await pool.query(
    "delete from placement_company_relationships where company_id in (select id from placement_companies where name = $1)",
    ["Messaging Systems"],
  );
  await pool.query(
    "delete from placement_companies where name = $1",
    ["Messaging Systems"],
  );
  await pool.query(
    "delete from users where id = $1",
    [recruiterUserId],
  );
}

async function setupRecruiter() {
  await pool.query(
    "insert into users (id, identity_uid, email, display_name) values ($1, $2, $3, $4)",
    [
      recruiterUserId,
      "seed-w05-message-recruiter",
      "w05-message-recruiter@example.com",
      "Message Recruiter",
    ],
  );
  const company = await createPlacementCompany(tpo, {
    collegeId: SEED_IDS.collegeA,
    name: "Messaging Systems",
    primaryDomain: "messaging-systems.example",
  });
  const grant = await grantPlacementRecruiter(tpo, {
    companyRelationshipId: company.relationship.id,
    email: "w05-message-recruiter@example.com",
    title: "Talent Partner",
  });
  const recruiter = await resolveRequestContext({
    identityUid: "seed-w05-message-recruiter",
  });
  return { company, grant, recruiter };
}

const suite =
  process.env.DB09_COLLABORATION_MIGRATION_APPLIED === "1"
    ? describe
    : describe.skip;

suite("DB09 W05 TPO recruiter private messages", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
    await closeDatabaseConnection();
  });

  it("creates one general thread under concurrent recruiter opens", async () => {
    const { recruiter } = await setupRecruiter();
    const rows = await Promise.all(
      Array.from({ length: 8 }, () =>
        openRecruiterMessageThread(recruiter, {
          collegeId: SEED_IDS.collegeA,
        }),
      ),
    );
    expect(new Set(rows.map(row => row.id)).size).toBe(1);
  });

  it("keeps sender/read receipt semantics private to the two sides", async () => {
    const { recruiter } = await setupRecruiter();
    const thread = await openTpoMessageThread(tpo, {
      collegeId: SEED_IDS.collegeA,
      recruiterUserId,
    });

    const sent = await sendThreadMessage(
      tpo,
      thread.id,
      "Can we discuss next week's hiring plan?",
    );
    expect(sent?.senderType).toBe("TPO");
    expect(sent?.readAt).toBeNull();

    const recruiterRead = await listThreadMessages(
      recruiter,
      thread.id,
    );
    expect(recruiterRead).toHaveLength(1);
    expect(recruiterRead[0]?.readAt).toBeInstanceOf(Date);

    const reply = await sendThreadMessage(
      recruiter,
      thread.id,
      "Yes, let's coordinate.",
    );
    expect(reply?.senderType).toBe("HR");

    const tpoRead = await listThreadMessages(tpo, thread.id);
    expect(tpoRead.at(-1)?.readAt).toBeInstanceOf(Date);
  });

  it("denies TPO access to a recruiter with no grant to that college", async () => {
    await setupRecruiter();
    await expect(
      openTpoMessageThread(tpoB, {
        collegeId: SEED_IDS.collegeB,
        recruiterUserId,
      }),
    ).rejects.toMatchObject({
      code: "TPO_MESSAGE_RECRUITER_NOT_FOUND",
    });
  });

  it("revoked recruiter cannot send or mark messages read from a stale context", async () => {
    const { grant, recruiter } = await setupRecruiter();
    const thread = await openRecruiterMessageThread(recruiter, {
      collegeId: SEED_IDS.collegeA,
    });
    await revokePlacementRecruiterGrant(tpo, grant.grant.id);

    await expect(
      sendThreadMessage(recruiter, thread.id, "stale session"),
    ).rejects.toMatchObject({ code: "TPO_MESSAGE_FORBIDDEN" });
    await expect(
      listThreadMessages(recruiter, thread.id),
    ).rejects.toMatchObject({ code: "TPO_MESSAGE_FORBIDDEN" });
  });
});
