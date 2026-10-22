import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import {
  LectureHallError,
  createLectureHall,
  listLectureHalls,
  updateLectureHall,
} from "@/modules/academics/lecture-hall-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Lecture hall tests require a disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: databaseUrl, max: 2 });

const RUN = randomUUID().slice(0, 8);
type Actor = { userId: string; membershipId: string; context: RequestContext };
const actors: Actor[] = [];
const hallIds: string[] = [];
const eventIds: string[] = [];

async function actor(collegeId: string, role: MembershipRole): Promise<Actor> {
  const userId = randomUUID();
  const membershipId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, identity_uid, display_name) VALUES ($1,$2,$3)",
    [userId, `hall-${userId}`, `HALL-${RUN}-${role}`],
  );
  await pool.query(
    "INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [membershipId, userId, collegeId],
  );
  await pool.query(
    "INSERT INTO membership_roles (membership_id,role) VALUES ($1,$2)",
    [membershipId, role],
  );
  const a: Actor = {
    userId,
    membershipId,
    context: {
      user: {
        id: userId,
        identityUid: `hall-${userId}`,
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: membershipId,
        collegeId,
        organizationId: SEED_IDS.organization,
        status: "ACTIVE",
        roles: [role],
      },
    },
  };
  actors.push(a);
  return a;
}

const code = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return "OK";
  } catch (error) {
    return error instanceof LectureHallError ? error.code : error;
  }
};

let adminA: Actor;
let adminB: Actor;
let learnerA: Actor;

beforeAll(async () => {
  adminA = await actor(SEED_IDS.collegeA, "COLLEGE_ADMIN");
  adminB = await actor(SEED_IDS.collegeB, "COLLEGE_ADMIN");
  learnerA = await actor(SEED_IDS.collegeA, "LEARNER");
});

afterAll(async () => {
  const cleanup = await pool.connect();
  try {
    // Events are inserted without their section, so cleanup skips FK triggers.
    await cleanup.query("SET session_replication_role = replica");
    for (const id of eventIds) {
      await cleanup.query("DELETE FROM section_schedule_events WHERE id=$1", [id]);
    }
    for (const id of hallIds) {
      await cleanup.query("DELETE FROM activity_events WHERE subject_type='lecture_hall' AND subject_id=$1", [id]);
      await cleanup.query("DELETE FROM lecture_halls WHERE id=$1", [id]);
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

async function make(name: string, extra: Record<string, unknown> = {}) {
  const hall = await createLectureHall(adminA.context, {
    collegeId: SEED_IDS.collegeA,
    name: `${name} ${RUN}`,
    capacity: 60,
    roomType: "CLASSROOM",
    ...extra,
  });
  hallIds.push(hall.id);
  return hall;
}

describe("lecture halls: create and list", () => {
  it("creates a hall and lists it with its department and class count", async () => {
    const dept = await pool.query(
      "SELECT id, name FROM departments WHERE college_id=$1 AND archived_at IS NULL LIMIT 1",
      [SEED_IDS.collegeA],
    );
    const hall = await make("Hall One", {
      departmentId: dept.rows[0].id,
      description: "  Ground floor  ",
      roomType: "LAB",
      capacity: "80",
    });
    expect(hall).toMatchObject({
      capacity: 80,
      roomType: "LAB",
      status: "ACTIVE",
      description: "Ground floor",
    });

    const listed = await listLectureHalls(adminA.context, {
      collegeId: SEED_IDS.collegeA,
    });
    const row = listed.items.find((item) => item.id === hall.id)!;
    expect(row.departmentName).toBe(dept.rows[0].name);
    expect(row.upcomingClasses).toBe(0);
  });

  it("filters by status and type", async () => {
    const lab = await make("Lab Filter", { roomType: "LAB" });
    const aud = await make("Aud Filter", { roomType: "AUDITORIUM" });
    const labs = await listLectureHalls(adminA.context, {
      collegeId: SEED_IDS.collegeA,
      roomType: "LAB",
    });
    expect(labs.items.map((h) => h.id)).toContain(lab.id);
    expect(labs.items.map((h) => h.id)).not.toContain(aud.id);
  });

  it("rejects invalid input", async () => {
    for (const body of [
      { name: "  ", capacity: 10, roomType: "CLASSROOM" },
      { name: "X", capacity: 0, roomType: "CLASSROOM" },
      { name: "X", capacity: 5001, roomType: "CLASSROOM" },
      { name: "X", capacity: 10, roomType: "GYM" },
      { name: "X", capacity: 10, roomType: "CLASSROOM", surprise: true },
    ]) {
      await expect(
        createLectureHall(adminA.context, { collegeId: SEED_IDS.collegeA, ...body }),
      ).rejects.toThrow();
    }
  });
});

describe("lecture halls: uniqueness and departments", () => {
  it("keeps names unique among active halls, case-insensitively", async () => {
    const hall = await make("Unique Name");
    expect(
      await code(
        createLectureHall(adminA.context, {
          collegeId: SEED_IDS.collegeA,
          name: hall.name.toUpperCase(),
          capacity: 10,
          roomType: "CLASSROOM",
        }),
      ),
    ).toBe("HALL_NAME_TAKEN");
    expect(
      await code(updateLectureHall(adminA.context, (await make("Other Name")).id, { name: hall.name })),
    ).toBe("HALL_NAME_TAKEN");
  });

  it("frees a name when archived and refuses to restore into a clash", async () => {
    const hall = await make("Reuse Name");
    await updateLectureHall(adminA.context, hall.id, { status: "ARCHIVED" });

    const replacement = await make("Reuse Name"); // allowed: the old one is archived
    expect(replacement.id).not.toBe(hall.id);

    expect(
      await code(updateLectureHall(adminA.context, hall.id, { status: "ACTIVE" })),
    ).toBe("HALL_NAME_TAKEN");
  });

  it("only accepts an active department of the same college", async () => {
    const other = await pool.query(
      "SELECT id FROM departments WHERE college_id=$1 AND archived_at IS NULL LIMIT 1",
      [SEED_IDS.collegeB],
    );
    expect(
      await code(
        createLectureHall(adminA.context, {
          collegeId: SEED_IDS.collegeA,
          name: `Wrong Dept ${RUN}`,
          capacity: 10,
          roomType: "CLASSROOM",
          departmentId: other.rows[0].id,
        }),
      ),
    ).toBe("DEPARTMENT_NOT_FOUND");
    expect(
      await code(
        createLectureHall(adminA.context, {
          collegeId: SEED_IDS.collegeA,
          name: `Ghost Dept ${RUN}`,
          capacity: 10,
          roomType: "CLASSROOM",
          departmentId: randomUUID(),
        }),
      ),
    ).toBe("DEPARTMENT_NOT_FOUND");
  });
});

describe("lecture halls: archive guard", () => {
  async function event(hallId: string, status: string, offsetHours: number) {
    const id = randomUUID();
    const cleanup = await pool.connect();
    try {
      await cleanup.query("SET session_replication_role = replica");
      await cleanup.query(
        `INSERT INTO section_schedule_events (id, section_id, lecture_hall_id, title, starts_at, ends_at, status)
         VALUES ($1,$2,$3,'Test class', now() + make_interval(hours => $4), now() + make_interval(hours => $4 + 1), $5)`,
        [id, randomUUID(), hallId, offsetHours, status],
      );
      await cleanup.query("SET session_replication_role = DEFAULT");
    } finally {
      cleanup.release();
    }
    eventIds.push(id);
  }

  it("blocks archiving while classes are scheduled, then allows it", async () => {
    const hall = await make("Busy Hall");
    await event(hall.id, "SCHEDULED", 24); // upcoming
    await event(hall.id, "SCHEDULED", -48); // already finished
    await event(hall.id, "CANCELLED", 24); // cancelled does not count

    const listed = await listLectureHalls(adminA.context, { collegeId: SEED_IDS.collegeA });
    expect(listed.items.find((h) => h.id === hall.id)!.upcomingClasses).toBe(1);

    try {
      await updateLectureHall(adminA.context, hall.id, { status: "ARCHIVED" });
      throw new Error("should have been blocked");
    } catch (error) {
      expect(error).toBeInstanceOf(LectureHallError);
      expect((error as LectureHallError).code).toBe("HALL_IN_USE");
      expect((error as LectureHallError).detail?.upcomingClasses).toBe(1);
    }

    const free = await make("Idle Hall");
    await event(free.id, "SCHEDULED", -72);
    const archived = await updateLectureHall(adminA.context, free.id, { status: "ARCHIVED" });
    expect(archived.status).toBe("ARCHIVED");
  });
});

describe("lecture halls: authorization", () => {
  it("denies another college's admin and a learner, for every operation", async () => {
    const hall = await make("Guarded Hall");

    // The room directory is privileged (cecd59696d): same-college learners
    // see their own scheduled room via class events, never enumerate halls.
    await expect(
      listLectureHalls(adminB.context, {collegeId:SEED_IDS.collegeA}),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      listLectureHalls(learnerA.context, {collegeId:SEED_IDS.collegeA}),
    ).rejects.toBeInstanceOf(AuthorizationError);
    for (const denied of [adminB, learnerA]) {
      await expect(
        createLectureHall(denied.context, {
          collegeId: SEED_IDS.collegeA,
          name: `Denied ${RUN}`,
          capacity: 10,
          roomType: "CLASSROOM",
        }),
      ).rejects.toBeInstanceOf(AuthorizationError);
      await expect(
        updateLectureHall(denied.context, hall.id, { capacity: 5 }),
      ).rejects.toBeInstanceOf(AuthorizationError);
    }

    const after = await listLectureHalls(adminA.context, { collegeId: SEED_IDS.collegeA });
    expect(after.items.find((h) => h.id === hall.id)!.capacity).toBe(60);
  });

  it("takes the college from the stored hall, not from the request", async () => {
    const hall = await make("Ownership Hall");
    // an admin of college B cannot move or claim it by passing their own college
    await expect(
      updateLectureHall(adminB.context, hall.id, { capacity: 1 }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(await code(updateLectureHall(adminA.context, randomUUID(), { capacity: 1 }))).toBe(
      "HALL_NOT_FOUND",
    );
    // the strict schema refuses a collegeId on update
    await expect(
      updateLectureHall(adminA.context, hall.id, { collegeId: SEED_IDS.collegeB }),
    ).rejects.toThrow();
  });

  it("can clear a description and a department with null", async () => {
    const hall = await make("Clearable", { description: "to clear" });
    const updated = await updateLectureHall(adminA.context, hall.id, {
      description: null,
      departmentId: null,
    });
    expect(updated.description).toBeNull();
    expect(updated.departmentId).toBeNull();
  });
});

function scopedSuperAdmin(collegeId: string | null): RequestContext {
  return {
    user: {
      id: SEED_IDS.superAdminUser,
      identityUid: "seed-superadmin",
      platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: {
      organizationId: SEED_IDS.organization,
      collegeId,
    },
  };
}

describe("lecture halls: Super Admin exact-college safety scope", () => {
  it("lists, creates, and updates inside the selected college only", async () => {
    const scoped = scopedSuperAdmin(SEED_IDS.collegeA);
    const own = await createLectureHall(scoped, {
      collegeId: SEED_IDS.collegeA,
      name: `Super Admin Hall ${RUN}`,
      roomType: "SEMINAR_HALL",
      capacity: 55,
      departmentId: SEED_IDS.departmentA,
    });
    hallIds.push(own.id);

    const foreign = await createLectureHall(adminB.context, {
      collegeId: SEED_IDS.collegeB,
      name: `Other College Hall ${RUN}`,
      roomType: "CLASSROOM",
      capacity: 45,
      departmentId: SEED_IDS.departmentB,
    });
    hallIds.push(foreign.id);

    const list = await listLectureHalls(scoped, {
      collegeId: SEED_IDS.collegeA,
    });
    expect(list.items.map((hall) => hall.id)).toContain(own.id);
    expect(list.items.map((hall) => hall.id)).not.toContain(foreign.id);
    expect(list.items.every((hall) => hall.id !== foreign.id)).toBe(true);
    expect((await updateLectureHall(scoped, own.id, { capacity: 65 })).capacity)
      .toBe(65);

    await expect(
      listLectureHalls(scoped, { collegeId: SEED_IDS.collegeB }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      createLectureHall(scoped, {
        collegeId: SEED_IDS.collegeB,
        name: `Cross-College Hall ${RUN}`,
        capacity: 20,
        roomType: "CLASSROOM",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      updateLectureHall(scoped, foreign.id, { capacity: 99 }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const foreignList = await listLectureHalls(adminB.context, {
      collegeId: SEED_IDS.collegeB,
    });
    expect(foreignList.items.find((hall) => hall.id === foreign.id)?.capacity)
      .toBe(45);
  });

  it("rejects unscoped or organization-only Super Admin API operations", async () => {
    const organizationOnly = scopedSuperAdmin(null);
    const global: RequestContext = {
      ...organizationOnly,
      adminScope: null,
    };
    const existingHall = await make("Super Admin Scope Guard");

    for (const context of [organizationOnly, global]) {
      await expect(
        listLectureHalls(context, { collegeId: SEED_IDS.collegeA }),
      ).rejects.toBeInstanceOf(AuthorizationError);
      await expect(
        createLectureHall(context, {
          collegeId: SEED_IDS.collegeA,
          name: `Disallowed Hall ${RUN}`,
          roomType: "CLASSROOM",
          capacity: 30,
        }),
      ).rejects.toBeInstanceOf(AuthorizationError);
      await expect(
        updateLectureHall(context, existingHall.id, { capacity: 20 }),
      ).rejects.toBeInstanceOf(AuthorizationError);
    }
    const kept = await listLectureHalls(adminA.context, {
      collegeId: SEED_IDS.collegeA,
    });
    expect(kept.items.find((hall) => hall.id === existingHall.id)?.capacity)
      .toBe(60);
  });
});
