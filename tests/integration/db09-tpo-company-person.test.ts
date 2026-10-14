import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  listTpoCompanyPeople, saveTpoCompanyPerson, TpoCompanyPersonStale,
} from "@/modules/placements/tpo-company-person-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "db09-contact-person",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
async function fixture(collegeId: string = SEED_IDS.collegeA) {
  if (!pool) throw new Error("Disposable test DB required");
  const token = randomUUID();
  const co = await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name, created_by_user_id) VALUES($1,$2) RETURNING id",
    ["People " + token, SEED_IDS.facultyUser],
  );
  const companyId = co.rows[0]?.id;
  if (!companyId) throw new Error("Company not inserted");
  await pool.query(
    "INSERT INTO placement_company_relationships(college_id, company_id, created_by_user_id) VALUES($1,$2,$3)",
    [collegeId, companyId, SEED_IDS.facultyUser],
  );
  return { companyId, token };
}
describe.skipIf(!enabled)("DB09 company contact people on isolated PostgreSQL", () => {
  afterAll(async () => {
    // Immutable DB09 actor audits are intentionally not deleted or disabled.
    // Their unique test records belong to this disposable DB, destroyed by the harness.
    await pool?.end(); await closeDatabaseConnection();
  });
  it("creates and edits linked contact with immutable actor audits", async () => {
    if (!pool) throw new Error("Pool required");
    const { companyId, token } = await fixture();
    const first = await saveTpoCompanyPerson(tpo, companyId, {
      action: "CREATE", confirmed: true,
      name: "Contact " + token, email: token + "@example.org",
    });
    const before = await listTpoCompanyPeople(tpo, companyId);
    const contact = before?.contacts.find(item => item.id === first.id);
    expect(contact?.email).toBe(token + "@example.org");
    if (!contact) throw new Error("Missing saved contact");
    const updated = await saveTpoCompanyPerson(tpo, companyId, {
      action: "EDIT", confirmed: true, leadId: contact.id,
      expectedUpdatedAt: contact.updatedAt,
      name: "Edited " + token, email: token + "@example.org",
    });
    expect(updated.id).toBe(first.id);
    await expect(saveTpoCompanyPerson(tpo, companyId, {
      action: "EDIT", confirmed: true, leadId: contact.id,
      expectedUpdatedAt: contact.updatedAt,
      name: "Stale", email: token + "@example.org",
    })).rejects.toBeInstanceOf(TpoCompanyPersonStale);
    const audit = await pool.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM placement_tpo_lead_activities WHERE lead_id=$1",
      [contact.id],
    );
    expect(audit.rows[0]?.count).toBe(2);
    const members = await listTpoCompanyPeople(tpo, companyId);
    expect(members?.contacts.find(item => item.id === first.id)?.name).toBe("Edited " + token);
  });
  it("denies wrong role and foreign college without an insert", async () => {
    const { companyId, token } = await fixture();
    const payload = { action: "CREATE", confirmed: true, name: "Blocked",
      email: token + "@example.org" };
    const wrong: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(saveTpoCompanyPerson(wrong, companyId, payload))
      .rejects.toBeInstanceOf(AuthorizationError);
    const foreign = await fixture(SEED_IDS.collegeB);
    await expect(saveTpoCompanyPerson(tpo, foreign.companyId, payload))
      .rejects.toBeDefined();
    expect((await listTpoCompanyPeople(tpo, foreign.companyId))).toBeNull();
  });
});
