import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipRole } from "@/modules/identity/constants";
import { AuthorizationError } from "@/modules/permissions/policy";
import { exportCollegeLectureHalls } from "@/modules/academics/college-lecture-halls-export-service";
import {
  createLectureHall,
  listLectureHalls,
  updateLectureHall,
} from "@/modules/academics/lecture-hall-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

function collegeContext(
  collegeId: string,
  membershipId: string,
  roles: readonly MembershipRole[],
): RequestContext {
  return {
    user: {
      id: SEED_IDS.collegeAdminUser,
      identityUid: "test-college-halls",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: membershipId,
      collegeId,
      organizationId: SEED_IDS.organization,
      status: "ACTIVE",
      roles,
    },
  };
}

const own = collegeContext(SEED_IDS.collegeA, SEED_IDS.collegeAdminMembership, ["COLLEGE_ADMIN"]);
const other = collegeContext(SEED_IDS.collegeB, SEED_IDS.facultyCollegeBMembership, ["COLLEGE_ADMIN"]);
const learner = collegeContext(SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership, ["LEARNER"]);
const suffix = randomUUID().slice(0, 10);
const hallName = "W3-Filter-Lab-" + suffix;
const createdIds: string[] = [];

describe.skipIf(!enabled)("College Admin lecture hall directory scoped PostgreSQL tests", () => {
  afterAll(async () => {
    try {
      if (pool) {
        for (const id of createdIds) {
          await pool.query("DELETE FROM lecture_halls WHERE id = $1", [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("searches the own college by exact literal fragments and paginates real halls", async () => {
    const hall = await createLectureHall(own, {
      collegeId: SEED_IDS.collegeA,
      name: hallName,
      capacity: 38,
      roomType: "LAB",
      description: "Ground floor lab",
    });
    createdIds.push(hall.id);

    const filtered = await listLectureHalls(own, {
      collegeId: SEED_IDS.collegeA,
      q: hallName,
      status: "ACTIVE",
      roomType: "LAB",
      limit: 25,
      offset: 0,
    });
    expect(filtered.items.map((item) => item.id)).toContain(hall.id);
    expect(filtered.pagination.total).toBeGreaterThanOrEqual(1);
    expect(filtered.pagination.limit).toBe(25);
    const [fits, tooSmall] = await Promise.all([
      listLectureHalls(own, { collegeId: SEED_IDS.collegeA, q: hallName, minimumCapacity: 38 }),
      listLectureHalls(own, { collegeId: SEED_IDS.collegeA, q: hallName, minimumCapacity: 39 }),
    ]);
    expect(fits.items.map(row => row.id)).toContain(hall.id);
    expect(tooSmall.items).toEqual([]);

    const csv=await exportCollegeLectureHalls(own,{q:hallName});
    expect(csv.csv).toContain(hallName);
    const foreignCsv=await exportCollegeLectureHalls(other,{q:hallName});
    expect(foreignCsv.csv).not.toContain(hallName);
    await expect(exportCollegeLectureHalls(learner,{})).rejects.toBeInstanceOf(AuthorizationError);

    const wrongType = await listLectureHalls(own, {
      collegeId: SEED_IDS.collegeA,
      q: hallName,
      roomType: "AUDITORIUM",
      limit: 25,
      offset: 0,
    });
    expect(wrongType.items).toEqual([]);
    expect(wrongType.pagination.total).toBe(0);

    const literalWildcard = await listLectureHalls(own, {
      collegeId: SEED_IDS.collegeA,
      q: "%",
      limit: 25,
      offset: 0,
    });
    expect(literalWildcard.items.some((row) => row.id === hall.id)).toBe(false);

    const pastEnd = await listLectureHalls(own, {
      collegeId: SEED_IDS.collegeA,
      q: hallName,
      limit: 25,
      offset: 25,
    });
    expect(pastEnd.items).toEqual([]);
    expect(pastEnd.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it("denies foreign-college reads, foreign edits and learner access", async () => {
    await expect(listLectureHalls(other, {
      collegeId: SEED_IDS.collegeA,
      q: hallName,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listLectureHalls(learner, {
      collegeId: SEED_IDS.collegeA,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listLectureHalls(own, {
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeInstanceOf(AuthorizationError);
    if (createdIds.length) {
      await expect(updateLectureHall(other, createdIds[0], {
        capacity: 99,
      })).rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("rejects unbounded or malformed name queries before an authorized read", async () => {
    await expect(listLectureHalls(own, {
      collegeId: SEED_IDS.collegeA,
      q: "x".repeat(101),
    })).rejects.toBeDefined();
    await expect(listLectureHalls(own, {
      collegeId: SEED_IDS.collegeA,
      roomType: "UNREGISTERED",
    })).rejects.toBeDefined();
  });
});
