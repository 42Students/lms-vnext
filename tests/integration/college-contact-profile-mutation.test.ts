import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  CollegeContactProfileError,
  updateOwnCollegeContactProfile,
} from "@/modules/colleges/college-contact-profile-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "w-contact-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};

describe.skipIf(!enabled)("College contact profile PostgreSQL mutation and tenant protection", () => {
  it("updates own college + branding + audit atomically; rejects stale and forged membership", async () => {
    const ids = { user: randomUUID(), membership: randomUUID(), role: randomUUID() };
    const marker = "college-profile-" + ids.user.slice(0, 8);
    await expect(getDb().transaction(async tx => {
      const [old] = await tx.execute(sql`select version,logo_url,primary_color
        from college_branding where college_id=${SEED_IDS.collegeA}`).then(r => r.rows);
      const version = typeof old?.version === "number" ? old.version : 0;
      const runner = <T>(fn: (inner: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0]) => Promise<T>) =>
        tx.transaction(fn);
      const run = (ctx: RequestContext, input: unknown) =>
        updateOwnCollegeContactProfile(ctx, input, runner);
      const input = {
        collegeName: marker, supportEmail: marker + "@example.edu",
        supportPhone: "+91 98765 43210",
        termsUrl: "https://example.edu/terms",
        privacyUrl: "https://example.edu/privacy",
        expectedVersion: version, confirm: true,
      };
      const saved = await run(admin, input);
      expect(saved).toMatchObject({
        collegeName: marker, version: version + 1,
      });
      const college = await tx.execute(sql`select name from colleges where id=${SEED_IDS.collegeA}`);
      expect(college.rows[0]?.name).toBe(marker);
      const after = await tx.execute(sql`select support_email,version,logo_url,primary_color
        from college_branding where college_id=${SEED_IDS.collegeA}`);
      expect(after.rows[0]).toMatchObject({
        support_email: marker + "@example.edu",
        version: version + 1,
        logo_url: old?.logo_url ?? null,
        primary_color: old?.primary_color ?? null,
      });
      await expect(run(admin, input)).rejects.toBeInstanceOf(CollegeContactProfileError);
      await expect(run(admin, { ...input, collegeId: SEED_IDS.collegeB }))
        .rejects.toBeDefined();

      await tx.execute(sql`insert into users(id,identity_uid,display_name)
        values (${ids.user},${marker},${marker})`);
      await tx.execute(sql`insert into college_memberships(id,user_id,college_id,status)
        values (${ids.membership},${ids.user},${SEED_IDS.collegeB},'ACTIVE')`);
      await tx.execute(sql`insert into membership_roles(id,membership_id,role)
        values (${ids.role},${ids.membership},'COLLEGE_ADMIN')`);
      const adminB: RequestContext = {
        user: { id: ids.user, identityUid: marker, platformStatus: "ACTIVE", systemRoles: [] },
        membership: { id: ids.membership, collegeId: SEED_IDS.collegeB,
          organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
      };
      const forged: RequestContext = {
        ...adminB,
        membership: { ...adminB.membership!, collegeId: SEED_IDS.collegeA },
      };
      await expect(run(forged, { ...input, expectedVersion: version + 1 }))
        .rejects.toBeInstanceOf(AuthorizationError);
      const [bBrand] = await tx.execute(sql`select version
        from college_branding where college_id=${SEED_IDS.collegeB}`).then(r => r.rows);
      const versionB = typeof bBrand?.version === "number" ? bBrand.version : 0;
      const saveB = await run(adminB, {
        ...input, collegeName: marker + "-B", expectedVersion: versionB,
      });
      expect(saveB.collegeName).toBe(marker + "-B");
      const unchangedA = await tx.execute(sql`select name from colleges where id=${SEED_IDS.collegeA}`);
      expect(unchangedA.rows[0]?.name).toBe(marker);

      const audit = await tx.execute(sql`select event_type from activity_events
        where subject_id=${SEED_IDS.collegeA} and event_type='platform.college.contact_updated'
        order by occurred_at desc limit 1`);
      expect(audit.rows).toHaveLength(1);
      throw new Error("ROLLBACK_COLLEGE_CONTACT_PROFILE");
    })).rejects.toThrow("ROLLBACK_COLLEGE_CONTACT_PROFILE");
  });
});
