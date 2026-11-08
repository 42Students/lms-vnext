import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  listTpoStudentSavedViews,
  mutateTpoStudentSavedView,
} from "@/modules/placements/tpo-student-saved-views-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL ||
    process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL ||
    !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")) {
  throw new Error("DB19-P24 requires a disposable *_test PostgreSQL database");
}
const pool = new Pool({connectionString: process.env.TEST_DATABASE_URL, max: 1});
const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB19-P24 TPO private saved-view deletion audit", () => {
  it("records owner/college deletion atomically and denies a forged college", async () => {
    const created = await mutateTpoStudentSavedView(tpo, {
      action: "CREATE",
      name: "P24 verified deletion " + crypto.randomUUID(),
      filters: {pageSize: 25},
      pinned: false,
    });
    expect(created.id).toBeTruthy();
    expect((await listTpoStudentSavedViews(tpo)).some(row => row.id === created.id))
      .toBe(true);

    const foreign: RequestContext = {
      ...tpo,
      membership: {...tpo.membership!, collegeId: SEED_IDS.collegeB},
    };
    await expect(mutateTpoStudentSavedView(foreign, {
      action: "DELETE", id: created.id,
    })).rejects.toBeDefined();
    expect((await listTpoStudentSavedViews(tpo)).some(row => row.id === created.id))
      .toBe(true);

    const removed = await mutateTpoStudentSavedView(tpo, {
      action: "DELETE", id: created.id,
    });
    expect(removed).toEqual({deleted: created.id});
    expect((await listTpoStudentSavedViews(tpo)).some(row => row.id === created.id))
      .toBe(false);
    const events = await pool.query<{
      actor_user_id: string;
      actor_membership_id: string;
      college_id: string;
      summary: string;
      metadata: {action?:string;scope?:string};
    }>(`
      SELECT actor_user_id,actor_membership_id,college_id,summary,metadata
        FROM activity_events
       WHERE subject_type='placement_tpo_saved_view'
         AND subject_id=$1 AND event_type='PLACEMENTS_TPO_STUDENT_SAVED_VIEW_CHANGED'
       ORDER BY occurred_at
    `,[created.id]);
    const deletion = events.rows.filter(row => row.metadata?.action === "DELETE");
    expect(deletion).toHaveLength(1);
    expect(deletion[0]).toMatchObject({
      actor_user_id: tpo.user.id,
      actor_membership_id: tpo.membership!.id,
      college_id: SEED_IDS.collegeA,
      summary: "TPO student saved view deleted",
      metadata: {action:"DELETE",scope:"STUDENTS"},
    });
  },30000);
});
