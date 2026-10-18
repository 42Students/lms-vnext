import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  changeTpoPublicJoinLink, getTpoPublicJoinLinkStatus,
  setTpoPublicJoinLinkEnabled, TpoPublicJoinLinkError,
} from "@/modules/placements/tpo-public-join-link-service";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const actor: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "chat2-public-links",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const companyIds: string[] = [];
const roleIds: string[] = [];

describe.skipIf(!enabled)("TPO-companies-01 scoped link lifecycle in PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable DB required");
    const inserted = await pool.query<{ id: string }>(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
      [SEED_IDS.facultyCollegeAMembership],
    );
    if (inserted.rows[0]?.id) roleIds.push(inserted.rows[0].id);
  });
  afterAll(async () => {
    if (pool) {
      for (const id of companyIds) {
        await pool.query("DELETE FROM placement_public_join_links WHERE company_id=$1", [id]);
        await pool.query("DELETE FROM placement_company_relationships WHERE company_id=$1", [id]);
        await pool.query("DELETE FROM placement_companies WHERE id=$1", [id]);
      }
      for (const id of roleIds) await pool.query("DELETE FROM membership_roles WHERE id=$1", [id]);
      await pool.end();
    }
    await closeDatabaseConnection();
  });
  it("hashes one-time company tokens and atomically rotates and revokes old links", async () => {
    if (!pool) throw new Error("Disposable DB required");
    const domain = "test-" + randomUUID().slice(0, 8) + ".example";
    const result = await pool.query<{ id: string }>(
      "INSERT INTO placement_companies(name,primary_domain,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
      ["Company public link " + randomUUID(), domain, SEED_IDS.facultyUser],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error("Fixture missing");
    companyIds.push(id);
    await pool.query(
      "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3)",
      [SEED_IDS.collegeA, id, SEED_IDS.facultyUser],
    );
    const input = { scope: "COMPANY", companyId: id, confirmed: true } as const;
    const first = await changeTpoPublicJoinLink(actor, { ...input, action: "CREATE" });
    const token = first.path.split("/").at(-1) ?? "";
    expect(token).toMatch(/^[A-Za-z0-9_-]{32,256}$/);
    expect(first.status.domain).toBe(domain);
    expect((await getPublicJoinPreview(token, "COMPANY")).kind).toBe("READY");
    const stored = await pool.query<{token_hash:string}>(
      "SELECT token_hash FROM placement_public_join_links WHERE company_id=$1", [id],
    );
    expect(stored.rows[0]?.token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.rows[0]?.token_hash).not.toBe(token);
    await expect(changeTpoPublicJoinLink(actor, { ...input, action: "CREATE" }))
      .rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    const oldId=first.status.link?.id;
    if(!oldId)throw new Error("Missing first public join link ID");
    await expect(changeTpoPublicJoinLink(actor, {
      ...input,action:"REPLACE",expectedLinkId:randomUUID(),
    })).rejects.toMatchObject({code:"STALE"});
    const next = await changeTpoPublicJoinLink(actor, {
      ...input,action:"REPLACE",expectedLinkId:oldId,
    });
    expect(next.path).not.toBe(first.path);
    const newId=next.status.link?.id;
    if(!newId)throw new Error("Missing replacement public join link ID");
    await expect(changeTpoPublicJoinLink(actor,{
      ...input,action:"REPLACE",expectedLinkId:oldId,
    })).rejects.toMatchObject({code:"STALE"});
    const disabled=await setTpoPublicJoinLinkEnabled(actor,{
      scope:"COMPANY",companyId:id,enabled:false,expectedLinkId:newId,
    });
    expect(disabled).toEqual({enabled:false});
    const enabledAgain=await setTpoPublicJoinLinkEnabled(actor,{
      scope:"COMPANY",companyId:id,enabled:true,expectedLinkId:newId,
    });
    expect(enabledAgain).toEqual({enabled:true});
    const eventsBeforeRetry=await pool.query<{total:number}>(`
      select count(*)::integer as total from activity_events where subject_id=$1
       and event_type='PLACEMENTS_PUBLIC_JOIN_LINK_ENABLED'`,[newId]);
    expect(eventsBeforeRetry.rows[0]?.total).toBe(2);
    expect(await setTpoPublicJoinLinkEnabled(actor,{
      scope:"COMPANY",companyId:id,enabled:true,expectedLinkId:newId,
    })).toEqual({enabled:true});
    const eventsAfterRetry=await pool.query<{total:number}>(`
      select count(*)::integer as total from activity_events where subject_id=$1
       and event_type='PLACEMENTS_PUBLIC_JOIN_LINK_ENABLED'`,[newId]);
    expect(eventsAfterRetry.rows[0]?.total).toBe(2);
    await expect(setTpoPublicJoinLinkEnabled(actor,{
      scope:"COMPANY",companyId:id,enabled:false,expectedLinkId:oldId,
    })).rejects.toMatchObject({code:"STALE"});
    expect((await getPublicJoinPreview(token, "COMPANY")).kind).toBe("UNAVAILABLE");
    expect((await getPublicJoinPreview(next.path.split("/").at(-1) ?? "", "COMPANY")).kind)
      .toBe("READY");
    expect((await getTpoPublicJoinLinkStatus(actor, "COMPANY", id)).link).not.toBeNull();
    const rows = await pool.query<{ revoked_at: Date | null }>(
      "SELECT revoked_at FROM placement_public_join_links WHERE company_id=$1", [id],
    );
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows.filter(r => r.revoked_at !== null)).toHaveLength(1);
    const foreign: RequestContext = { ...actor, membership: {
      ...actor.membership!, collegeId: SEED_IDS.collegeB,
    } };
    await expect(changeTpoPublicJoinLink(foreign, { ...input, action: "REPLACE",expectedLinkId:newId }))
      .rejects.toBeInstanceOf(TpoPublicJoinLinkError);
  });
});
