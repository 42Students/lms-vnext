import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoMyNotifications } from "@/modules/placements/tpo-my-notifications-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Notification tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let addedTpoRoleId:string|null=null;
beforeAll(async()=>{
  const result=await pool.query<{id:string}>(
    "insert into membership_roles(membership_id,role) values($1,'TPO') on conflict do nothing returning id",
    [SEED_IDS.collegeAdminMembership]);
  addedTpoRoleId=result.rows[0]?.id??null;
});
afterAll(async()=>{
  if(addedTpoRoleId)await pool.query("delete from membership_roles where id=$1",[addedTpoRoleId]);
  await pool.end();
  await closeDatabaseConnection();
});

describe("TPO my notifications against PostgreSQL", () => {
  it("reads own notifications and preferences", async () => {
    const r = await getTpoMyNotifications(tpo, {});
    expect(r.summary.total).toBe(r.summary.unread + r.summary.read);
    expect(["PERSISTED", "SOURCE_DEFAULT", "UNAVAILABLE"]).toContain(r.preferences.source);
    for (const view of ["UNREAD", "READ"]) {
      const f = await getTpoMyNotifications(tpo, { view });
      expect(f.matchedTotal).toBeLessThanOrEqual(r.summary.total);
    }
  });

  it("rejects a non-TPO membership", async () => {
    await expect(
      getTpoMyNotifications(
        { ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] } },
        {},
      ),
    ).rejects.toBeDefined();
  });
});
