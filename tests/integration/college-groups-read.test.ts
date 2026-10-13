import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import {
  GroupReadError,
  getCollegeGroupDetail,
  listCollegeGroups,
} from "@/modules/groups/admin-read-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("College groups read tests require a disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: databaseUrl, max: 2 });

const RUN = randomUUID().slice(0, 8);
type Actor = { userId: string; membershipId: string; context: RequestContext };
const actors: Actor[] = [];
const groupIds: string[] = [];

async function actor(
  collegeId: string,
  role: MembershipRole,
  name = `GRP-${RUN}-${role}`,
): Promise<Actor> {
  const userId = randomUUID();
  const membershipId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, identity_uid, display_name) VALUES ($1,$2,$3)",
    [userId, `grp-read-${userId}`, name],
  );
  await pool.query(
    "INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [membershipId, userId, collegeId],
  );
  await pool.query(
    "INSERT INTO membership_roles (membership_id,role) VALUES ($1,$2)",
    [membershipId, role],
  );
  const organizationId = SEED_IDS.organization;
  const a: Actor = {
    userId,
    membershipId,
    context: {
      user: {
        id: userId,
        identityUid: `grp-read-${userId}`,
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: membershipId,
        collegeId,
        organizationId,
        status: "ACTIVE",
        roles: [role],
      },
    },
  };
  actors.push(a);
  return a;
}

async function group(
  collegeId: string | null,
  fields: { name: string; kind?: string; status?: string; deleted?: boolean },
  createdBy: string,
) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO lms_groups
       (id, kind, owner_scope, college_id, name, status, created_by_user_id, deleted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      fields.kind ?? "STUDY_GROUP",
      collegeId ? "COLLEGE" : "PLATFORM",
      collegeId,
      fields.name,
      fields.status ?? "ACTIVE",
      createdBy,
      fields.deleted ? new Date() : null,
    ],
  );
  groupIds.push(id);
  return id;
}

async function addMember(groupId: string, membershipId: string, state: string, position?: number) {
  await pool.query(
    `INSERT INTO lms_group_members (group_id, membership_id, state, source, waitlist_position, joined_at)
     VALUES ($1,$2,$3,'MANUAL',$4,$5)`,
    [groupId, membershipId, state, position ?? null, state === "ACTIVE" ? new Date() : null],
  );
}

let adminA: Actor;
let adminB: Actor;
let learnerA: Actor;
let alpha: string;
let removedGroup: string;
let otherCollege: string;
let platform: string;

beforeAll(async () => {
  adminA = await actor(SEED_IDS.collegeA, "COLLEGE_ADMIN");
  adminB = await actor(SEED_IDS.collegeB, "COLLEGE_ADMIN");
  learnerA = await actor(SEED_IDS.collegeA, "LEARNER", `Alice-${RUN}`);
  const learner2 = await actor(SEED_IDS.collegeA, "LEARNER", `Bob-${RUN}`);
  const learner3 = await actor(SEED_IDS.collegeA, "LEARNER", `Cara-${RUN}`);

  alpha = await group(SEED_IDS.collegeA, { name: `Alpha ${RUN}`, kind: "STUDY_GROUP" }, adminA.userId);
  await group(SEED_IDS.collegeA, { name: `Beta ${RUN}`, kind: "PROJECT_TEAM" }, adminA.userId);
  await group(SEED_IDS.collegeA, { name: `Old ${RUN}`, status: "ARCHIVED" }, adminA.userId);
  removedGroup = await group(SEED_IDS.collegeA, { name: `Gone ${RUN}`, deleted: true }, adminA.userId);
  otherCollege = await group(SEED_IDS.collegeB, { name: `OtherCollege ${RUN}` }, adminB.userId);
  platform = await group(null, { name: `Platform ${RUN}` }, adminA.userId);

  await addMember(alpha, learnerA.membershipId, "ACTIVE");
  await addMember(alpha, learner2.membershipId, "WAITLISTED", 1);
  await addMember(alpha, learner3.membershipId, "REQUESTED");
  await pool.query(
    `INSERT INTO lms_group_member_events
       (group_id, membership_id, from_state, to_state, source, actor_type, actor_user_id, reason)
     VALUES ($1,$2,NULL,'ACTIVE','MANUAL','COLLEGE_ADMIN',$3,'added in test')`,
    [alpha, learnerA.membershipId, adminA.userId],
  );
});

afterAll(async () => {
  // Member event history is append-only (a trigger rejects DELETE), so this
  // test-owned cleanup runs in a session that bypasses triggers.
  const cleanup = await pool.connect();
  try {
    await cleanup.query("SET session_replication_role = replica");
    for (const id of groupIds.reverse()) {
      await cleanup.query("DELETE FROM lms_group_member_events WHERE group_id=$1", [id]);
      await cleanup.query("DELETE FROM lms_group_members WHERE group_id=$1", [id]);
      await cleanup.query("DELETE FROM lms_groups WHERE id=$1", [id]);
    }
    await cleanup.query("SET session_replication_role = DEFAULT");
  } finally {
    cleanup.release();
  }
  for (const a of actors.reverse()) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [a.membershipId]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1", [a.membershipId]);
    await pool.query("DELETE FROM users WHERE id=$1", [a.userId]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

const names = (rows: { name: string }[]) =>
  rows.map((row) => row.name).filter((name) => name.endsWith(RUN));

describe("college groups: list", () => {
  it("lists only this college's live college-owned groups with queue counts", async () => {
    const result = await listCollegeGroups(adminA.context, { collegeId: SEED_IDS.collegeA });
    const mine = names(result.items);

    expect(mine).toContain(`Alpha ${RUN}`);
    expect(mine).toContain(`Beta ${RUN}`);
    expect(mine).toContain(`Old ${RUN}`);
    expect(mine).not.toContain(`Gone ${RUN}`); // soft-deleted
    expect(mine).not.toContain(`OtherCollege ${RUN}`); // another college
    expect(mine).not.toContain(`Platform ${RUN}`); // platform-owned

    const row = result.items.find((item) => item.id === alpha)!;
    expect(row.waitlistedCount).toBe(1);
    expect(row.requestedCount).toBe(1);
    expect(result.kinds).toEqual(expect.arrayContaining(["PROJECT_TEAM", "STUDY_GROUP"]));
  });

  it("filters by type and status and reports the total for paging", async () => {
    const teams = await listCollegeGroups(adminA.context, {
      collegeId: SEED_IDS.collegeA,
      kind: "PROJECT_TEAM",
    });
    expect(names(teams.items)).toEqual([`Beta ${RUN}`]);

    const archivedOnly = await listCollegeGroups(adminA.context, {
      collegeId: SEED_IDS.collegeA,
      status: "ARCHIVED",
    });
    expect(names(archivedOnly.items)).toEqual([`Old ${RUN}`]);

    const first = await listCollegeGroups(adminA.context, {
      collegeId: SEED_IDS.collegeA,
      limit: 1,
    });
    expect(first.items).toHaveLength(1);
    expect(first.pagination.total).toBeGreaterThanOrEqual(3);
  });

  it("rejects bad input", async () => {
    await expect(
      listCollegeGroups(adminA.context, { collegeId: "not-a-uuid" }),
    ).rejects.toThrow();
    await expect(
      listCollegeGroups(adminA.context, { collegeId: SEED_IDS.collegeA, status: "WRONG" }),
    ).rejects.toThrow();
  });

  it("denies another college's admin and a learner of the same college", async () => {
    await expect(
      listCollegeGroups(adminB.context, { collegeId: SEED_IDS.collegeA }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      listCollegeGroups(learnerA.context, { collegeId: SEED_IDS.collegeA }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("reports an unknown college", async () => {
    await expect(
      listCollegeGroups(adminA.context, { collegeId: randomUUID() }),
    ).rejects.toBeInstanceOf(GroupReadError);
  });
});

describe("college groups: detail", () => {
  it("shows members in a useful order, the queue counts and recent activity", async () => {
    const detail = await getCollegeGroupDetail(adminA.context, alpha);

    expect(detail.group.name).toBe(`Alpha ${RUN}`);
    expect(detail.counts).toEqual({ active: 1, waitlisted: 1, requested: 1, removed: 0 });
    // active first, then waitlisted, then requested
    expect(detail.members.map((member) => member.state)).toEqual([
      "ACTIVE",
      "WAITLISTED",
      "REQUESTED",
    ]);
    expect(detail.members[0].displayName).toBe(`Alice-${RUN}`);
    expect(detail.members[1].waitlistPosition).toBe(1);
    expect(detail.events).toHaveLength(1);
    expect(detail.events[0]).toMatchObject({
      toState: "ACTIVE",
      actorType: "COLLEGE_ADMIN",
      reason: "added in test",
    });
  });

  it("does not expose contact details", async () => {
    const detail = await getCollegeGroupDetail(adminA.context, alpha);
    const text = JSON.stringify(detail);
    expect(text).not.toMatch(/phone|email|identity_uid|identityUid/i);
  });

  it("denies a college admin from another college and a learner", async () => {
    await expect(getCollegeGroupDetail(adminB.context, alpha)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    await expect(getCollegeGroupDetail(learnerA.context, alpha)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("treats other colleges', platform-owned, deleted and unknown groups as not found or denied", async () => {
    // another college's group: denied, never revealed
    await expect(getCollegeGroupDetail(adminA.context, otherCollege)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    // platform-owned and soft-deleted look like they do not exist
    await expect(getCollegeGroupDetail(adminA.context, platform)).rejects.toBeInstanceOf(
      GroupReadError,
    );
    await expect(getCollegeGroupDetail(adminA.context, removedGroup)).rejects.toBeInstanceOf(
      GroupReadError,
    );
    await expect(getCollegeGroupDetail(adminA.context, randomUUID())).rejects.toBeInstanceOf(
      GroupReadError,
    );
    await expect(getCollegeGroupDetail(adminA.context, "nope")).rejects.toThrow();
  });
});
