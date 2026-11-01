import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { drizzleTenantDomainRepository as repository } from "@/modules/tenant-domains/repository";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

// Use only the independent disposable registered PostgreSQL target.
const enabled = !!process.env.TEST_DATABASE_URL &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const actor: RequestContext = {
  user: { id: SEED_IDS.superAdminUser, identityUid: "p04-superadmin",
    platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: null,
};

afterAll(async () => {
  await pool?.end();
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB19-P04 archived organization tenant-domain negative witness", () => {
  it("denies all six domain mutations while parent organization is archived and restores verified routing only when active", async () => {
    const suffix = randomUUID();
    const organizationId = randomUUID();
    const collegeId = randomUUID();
    const pendingHost = `p04-pending-${suffix}.example.test`;
    const verifiedHost = `p04-verified-${suffix}.example.test`;
    let pendingId: string | null = null;
    let verifiedId: string | null = null;
    try {
      await pool!.query(
        "insert into organizations(id,name,status) values($1,$2,'ACTIVE')",
        [organizationId, "P04 Disposition Org " + suffix],
      );
      await pool!.query(
        "insert into colleges(id,organization_id,name,code,status) values($1,$2,$3,$4,'ACTIVE')",
        [collegeId, organizationId, "P04 Disposition College " + suffix, "P04-" + suffix],
      );
      const pending = await pool!.query<{id:string}>(
        "insert into tenant_domains(college_id,host,is_verified,is_primary) values($1,$2,false,false) returning id",
        [collegeId, pendingHost],
      );
      pendingId = pending.rows[0]!.id;
      const verified = await pool!.query<{id:string}>(
        "insert into tenant_domains(college_id,host,is_verified,is_primary,verified_at) values($1,$2,true,false,now()) returning id",
        [collegeId, verifiedHost],
      );
      verifiedId = verified.rows[0]!.id;
      await expect(repository.resolveVerifiedHost(verifiedHost))
        .resolves.toMatchObject({ collegeId, organizationId, host: verifiedHost });

      await pool!.query(
        "update organizations set status='ARCHIVED' where id=$1",
        [organizationId],
      );
      await expect(repository.resolveVerifiedHost(verifiedHost)).resolves.toBeNull();
      const requiredError = { code: "DOMAIN_NOT_FOUND" };
      const input = { context: actor, domainId: pendingId, expectedHost: pendingHost };
      await expect(repository.ensureToken!({ ...input, token: "must-not-persist" }))
        .rejects.toMatchObject(requiredError);
      await expect(repository.ensureVerifiedToken!({
        context: actor, domainId: verifiedId, expectedHost: verifiedHost, token: "must-not-issue",
      })).rejects.toMatchObject(requiredError);
      await expect(repository.editDomainHost({
        ...input, host: `p04-modified-${suffix}.example.test`, verificationToken: "bad-update",
      })).rejects.toMatchObject(requiredError);
      await expect(repository.recordVerificationResult(pendingId, {
        context: actor, expectedHost: pendingHost, expectedToken: "unissued",
        verified: true, result: "VERIFIED", checkedAt: new Date(),
      })).rejects.toMatchObject(requiredError);
      await expect(repository.setPrimary(verifiedId, actor))
        .rejects.toMatchObject(requiredError);
      await expect(repository.deleteDomain(pendingId, undefined, actor))
        .rejects.toMatchObject(requiredError);

      const rows = await pool!.query<{
        host:string;is_primary:boolean;is_verified:boolean;
        verification_token:string|null;deleted_at:Date|null;
      }>(
        "select host,is_primary,is_verified,verification_token,deleted_at from tenant_domains where id=any($1::uuid[]) order by host",
        [[pendingId, verifiedId]],
      );
      expect(rows.rows).toHaveLength(2);
      expect(rows.rows.find(row => row.host === pendingHost)).toEqual({
        host: pendingHost, is_primary: false, is_verified: false,
        verification_token: null, deleted_at: null,
      });
      expect(rows.rows.find(row => row.host === verifiedHost)).toEqual({
        host: verifiedHost, is_primary: false, is_verified: true,
        verification_token: null, deleted_at: null,
      });

      await pool!.query("update organizations set status='ACTIVE' where id=$1", [organizationId]);
      await expect(repository.resolveVerifiedHost(verifiedHost))
        .resolves.toMatchObject({collegeId, organizationId, host:verifiedHost});
    } finally {
      if (pendingId || verifiedId) {
        await pool!.query("delete from tenant_domains where college_id=$1", [collegeId]);
      }
      await pool!.query("delete from colleges where id=$1", [collegeId]);
      await pool!.query("delete from organizations where id=$1", [organizationId]);
    }
  });
});
