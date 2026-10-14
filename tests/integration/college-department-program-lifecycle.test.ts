import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createCollegeDepartment, renameCollegeDepartment, archiveCollegeDepartment,
} from "@/modules/departments/college-department-mutation-service";
import {
  createCollegeProgram, archiveCollegeProgram, restoreCollegeProgram,
} from "@/modules/academics/college-program-mutation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "college-dept-writer", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = { ...admin,
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] } };
const learner: RequestContext = { ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] } };
const id = { department: "", program: "" };
const name = "w-dept-" + randomUUID().slice(0, 10);

describe.skipIf(!enabled)("College Department & program lifecycle: real isolated PostgreSQL", () => {
  afterAll(async () => {
    try {
      if (pool) {
        if (id.program) await pool.query("DELETE FROM programs WHERE id=$1", [id.program]);
        if (id.department) await pool.query("DELETE FROM departments WHERE id=$1", [id.department]);
        // Append-only activity_events are never deleted.
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("creates, renames, archives and restores a program; blocks department archival while referenced", async () => {
    const created = await createCollegeDepartment(admin, { name });
    id.department = created.id;
    const renamed = await renameCollegeDepartment(admin, created.id, { name: name + "-new", confirm: true });
    expect(renamed.name).toBe(name + "-new");
    const program = await createCollegeProgram(admin, {
      departmentId: id.department, name: name + "-program", code: name.replaceAll("-", "_"), durationTerms: 8,
    });
    id.program = program.id;
    await expect(archiveCollegeDepartment(admin, created.id, { confirm: true }))
      .rejects.toMatchObject({ code: "DEPARTMENT_HAS_DEPENDENCIES" });
    const archived = await archiveCollegeProgram(admin, program.id, { confirm: true });
    expect(archived.status).toBe("ARCHIVED");
    // Historical program references still block parent department archival.
    await expect(archiveCollegeDepartment(admin, created.id, { confirm: true }))
      .rejects.toMatchObject({ code: "DEPARTMENT_HAS_DEPENDENCIES" });
    const restored = await restoreCollegeProgram(admin, program.id, {
      action: "RESTORE", confirm: true,
    });
    expect(restored.status).toBe("ACTIVE");
    const events = await pool!.query(
      "SELECT subject_type,event_type FROM activity_events WHERE subject_id=ANY($1::text[]) ORDER BY occurred_at",
      [[created.id, program.id]],
    );
    expect(events.rows.some(row => row.subject_type === "department")).toBe(true);
    expect(events.rows.some(row => row.subject_type === "program")).toBe(true);
    await pool!.query("DELETE FROM programs WHERE id=$1", [id.program]);
    id.program = "";
    const department = await archiveCollegeDepartment(admin, created.id, { confirm: true });
    expect(department.archivedAt).not.toBeNull();
  });
  it("denies foreign college, wrong role and forged IDs", async () => {
    // A learner can never create; another college's admin may only act in their own college.
    await expect(createCollegeDepartment(learner, { name: name + "denied" }))
      .rejects.toBeInstanceOf(AuthorizationError);
    for (const ctx of [foreign, learner]) {
      if (id.department) await expect(renameCollegeDepartment(ctx, id.department, {
        name: "forged-name", confirm: true,
      })).rejects.toBeDefined();
    }
    await expect(createCollegeDepartment(admin, {
      name: "forged", collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(archiveCollegeDepartment(admin, id.department, {
      confirm: true, collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
