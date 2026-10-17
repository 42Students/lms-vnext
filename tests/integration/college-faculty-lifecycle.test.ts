import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { transitionCollegeFaculty } from "@/modules/people/college-faculty-lifecycle-service";
import { listCollegeActivity } from "@/modules/activity/college-activity-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "faculty-lifecycle-owner",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = { ...admin,
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] } };
const learner: RequestContext = { ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] } };
const id = { user: randomUUID(), member: randomUUID(), role: randomUUID(), period: randomUUID(),
  program: randomUUID(), cohort: randomUUID(), section: randomUUID(), advisor: randomUUID() };
const label = "w-faculty-life-" + id.user.slice(0, 8);

describe.skipIf(!enabled)("Faculty lifecycle, real PG tenant and active-duty guards", () => {
  beforeAll(async () => {
    if (!pool) throw Error("isolated PG required");
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [id.user, "faculty-" + id.user, label]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [id.member, id.user, SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')",
      [id.role, id.member]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [id.period, SEED_IDS.collegeA, label, label]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)", [id.program, SEED_IDS.departmentA, label, label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) " +
      "VALUES($1,$2,$3,$4,$5)", [id.cohort, id.program, label, label, id.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) " +
      "VALUES($1,$2,$3,$4,$5)", [id.section, id.cohort, id.period, label, label]);
    await pool.query("INSERT INTO section_faculty_assignments(id,section_id,membership_id,role) " +
      "VALUES($1,$2,$3,'ADVISOR')", [id.advisor, id.section, id.member]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM section_faculty_assignments WHERE id=$1", [id.advisor]);
        await pool.query("DELETE FROM sections WHERE id=$1", [id.section]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [id.cohort]);
        await pool.query("DELETE FROM programs WHERE id=$1", [id.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [id.period]);
        await pool.query("DELETE FROM membership_roles WHERE id=$1", [id.role]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [id.member]);
        await pool.query("DELETE FROM users WHERE id=$1", [id.user]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("blocks active academic responsibility, then suspends and reactivates with immutable audit", async () => {
    await expect(transitionCollegeFaculty(admin, id.member, {
      action: "DEACTIVATE", expectedStatus: "ACTIVE", reason: "Term completed", confirm: true,
    })).rejects.toMatchObject({ code: "FACULTY_HAS_ACTIVE_ASSIGNMENTS" });
    await pool!.query("UPDATE section_faculty_assignments SET ended_at=now() WHERE id=$1", [id.advisor]);
    const suspended = await transitionCollegeFaculty(admin, id.member, {
      action: "DEACTIVATE", expectedStatus: "ACTIVE", reason: "Contract paused", confirm: true,
    });
    expect(suspended.status).toBe("SUSPENDED");
    await expect(transitionCollegeFaculty(admin, id.member, {
      action: "DEACTIVATE", expectedStatus: "ACTIVE", reason: "Stale", confirm: true,
    })).rejects.toMatchObject({ code: "FACULTY_STATUS_CHANGED" });
    const active = await transitionCollegeFaculty(admin, id.member, {
      action: "REACTIVATE", expectedStatus: "SUSPENDED", confirm: true,
    });
    expect(active.status).toBe("ACTIVE");
    const events = await pool!.query(
      "SELECT event_type FROM activity_events WHERE subject_id=$1 ORDER BY occurred_at",
      [id.member],
    );
    expect(events.rows.map(row => row.event_type)).toContain("identity.membership.suspended");
    expect(events.rows.map(row => row.event_type)).toContain("identity.membership.reactivated");
    const history = await listCollegeActivity(admin, {
      view: "EVERYTHING", subjectType: "college_membership", subjectId: id.member,
    });
    expect(history.items.some(item => item.event.eventType === "identity.membership.suspended")).toBe(true);
    expect(history.items.some(item => item.event.eventType === "identity.membership.reactivated")).toBe(true);
    const noLeak = await listCollegeActivity(foreign, {
      subjectType: "college_membership", subjectId: id.member,
    });
    expect(noLeak.items).toHaveLength(0);
  });
  it("COL-people-R02 rejects deactivation of faculty accounts with protected TPO roles",async()=>{
    const protectedRole=randomUUID();
    await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'TPO')",
      [protectedRole,id.member]);
    try{
      await expect(transitionCollegeFaculty(admin,id.member,{
        action:"DEACTIVATE",expectedStatus:"ACTIVE",reason:"Protected account",confirm:true,
      })).rejects.toMatchObject({code:"MEMBERSHIP_PROTECTED"});
    }finally{
      await pool!.query("DELETE FROM membership_roles WHERE id=$1",[protectedRole]);
    }
  });
  it("denies foreign college, non-admin and extra caller scope fields", async () => {
    // Another college's admin must not learn the faculty member exists.
    await expect(transitionCollegeFaculty(foreign, id.member, {
      action: "DEACTIVATE", expectedStatus: "ACTIVE", reason: "No access", confirm: true,
    })).rejects.toMatchObject({ code: expect.stringMatching(/^FACULTY_NOT_/) });
    await expect(transitionCollegeFaculty(learner, id.member, {
      action: "DEACTIVATE", expectedStatus: "ACTIVE", reason: "No access", confirm: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(transitionCollegeFaculty(admin, id.member, {
      action: "REACTIVATE", expectedStatus: "SUSPENDED", confirm: true,
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
