import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createLectureHall, updateLectureHall, LectureHallError,
} from "@/modules/academics/lecture-hall-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "hall-hardening", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "hall-hardening-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const ids = {
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  section: randomUUID(), event: randomUUID(),
};
const label = "HallHardening-" + ids.period.slice(0, 8);
let hallId: string | undefined;
describe.skipIf(!enabled)("College Admin lecture hall transaction and scheduled-row guards", () => {
  beforeAll(async () => {
    if (!pool) throw Error("DB03 disposable PostgreSQL required");
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, label],
    );
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program, SEED_IDS.departmentA, label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort, ids.program, label, ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity) " +
      "VALUES($1,$2,$3,$4::text,$4::text,70)", [ids.section, ids.cohort, ids.period, label]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM section_schedule_events WHERE id=$1", [ids.event]);
        if (hallId) {
          await pool.query("DELETE FROM activity_events WHERE subject_type='lecture_hall' AND subject_id=$1", [hallId]);
          await pool.query("DELETE FROM lecture_halls WHERE id=$1", [hallId]);
        }
        await pool.query("DELETE FROM sections WHERE id=$1", [ids.section]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("creates a persisted hall with immutable activity, denies foreign college writes", async () => {
    const hall = await createLectureHall(admin, {
      collegeId: SEED_IDS.collegeA, name: label, capacity: 90, roomType: "LECTURE_HALL",
      departmentId: SEED_IDS.departmentA,
    });
    hallId = hall.id;
    await expect(updateLectureHall(foreign, hall.id, { capacity: 20 }))
      .rejects.toBeInstanceOf(AuthorizationError);
    const rows = await pool!.query(
      "SELECT event_type FROM activity_events WHERE subject_type='lecture_hall' AND subject_id=$1 ORDER BY occurred_at",
      [hall.id],
    );
    expect(rows.rows.map(row => row.event_type)).toContain("academics.lecture_hall.created");
  });
  it("evaluates actual future scheduled session rows before capacity shrink and archive", async () => {
    await pool!.query(
      "INSERT INTO section_schedule_events(id,section_id,lecture_hall_id,title,starts_at,ends_at,status) " +
      "VALUES($1,$2,$3,$4, now() + interval '1 day',now() + interval '1 day 1 hour','SCHEDULED')",
      [ids.event, ids.section, hallId, label],
    );
    await expect(updateLectureHall(admin, hallId!, { capacity: 60 }))
      .rejects.toMatchObject({ code: "HALL_CAPACITY_CONFLICT" });
    await expect(updateLectureHall(admin, hallId!, { status: "ARCHIVED" }))
      .rejects.toMatchObject({ code: "HALL_IN_USE" });
    await pool!.query("UPDATE section_schedule_events SET status='CANCELLED' WHERE id=$1", [ids.event]);
    const shrunk = await updateLectureHall(admin, hallId!, { capacity: 60 });
    expect(shrunk.capacity).toBe(60);
    const archived = await updateLectureHall(admin, hallId!, { status: "ARCHIVED" });
    expect(archived.status).toBe("ARCHIVED");
    const rows = await pool!.query(
      "SELECT event_type FROM activity_events WHERE subject_type='lecture_hall' AND subject_id=$1 ORDER BY occurred_at",
      [hallId],
    );
    expect(rows.rows).toHaveLength(3);
  });
  it("rejects malformed updates before touching the hall", async () => {
    await expect(updateLectureHall(admin, hallId!, { capacity: 0 }))
      .rejects.toBeDefined();
    await expect(updateLectureHall(admin, hallId!, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
  });
});
