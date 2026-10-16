import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { requestPublicJoinCode } from "@/modules/placements/public-join/send-code-service";
import { acceptPublicRecruiterJoin } from "@/modules/placements/public-join/join-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  process.env.PUBLIC_JOIN_RATE_EVENTS_READY === "1" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  Boolean(process.env.TPO_RECRUITER_OTP_HMAC_SECRET);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 2,
}) : null;

describe.skipIf(!enabled)("TPO-campaigns-public-19/20 disposable PostgreSQL workflow", () => {
  afterAll(async () => {
    if (pool) await pool.end();
    await closeDatabaseConnection();
  });
  it("delivers a bounded code, records failure budget, consumes once and grants scoped access", async () => {
    if (!pool) throw new Error("Isolated PostgreSQL is required");
    const domain = "public-" + randomUUID().slice(0, 8) + ".example";
    const email = "recruiter@" + domain;
    const token = randomBytes(32).toString("base64url");
    const [company] = (await pool.query<{ id: string }>(
      "INSERT INTO placement_companies(name,primary_domain,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
      ["Public joined company " + randomUUID(), domain, SEED_IDS.facultyUser],
    )).rows;
    if (!company) throw new Error("Fixture missing company");
    await pool.query(
      "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3)",
      [SEED_IDS.collegeA, company.id, SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_tpo_college_settings(college_id,recruiter_access_months) VALUES($1,6) ON CONFLICT DO NOTHING",
      [SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO placement_public_join_links(token_hash,college_id,company_id,company_domain,scope,expires_at) VALUES($1,$2,$3,$4,'COMPANY',now()+interval '1 day')",
      [createHash("sha256").update(token).digest("hex"), SEED_IDS.collegeA, company.id, domain],
    );
    let delivered = "";
    const input = { token, email };
    const sent = await requestPublicJoinCode("COMPANY", input, "198.51.100.42",
      async (_email, code) => { delivered = code; return true; });
    expect(sent).toEqual({ sent: true });
    await expect(requestPublicJoinCode("COLLEGE", input, "198.51.100.42",
      async () => true)).rejects.toMatchObject({ code: "INVALID_LINK" });
    await expect(requestPublicJoinCode("COMPANY", {
      token, email: "person@another-company.example",
    }, "198.51.100.42", async () => true)).rejects.toMatchObject({ code: "INVALID_LINK" });
    expect(delivered).toMatch(/^[0-9]{6}$/);
    const join = { ...input, name: "Recruiter", designation: "", phone: "",
      companyName: "", code: delivered === "000000" ? "999999" : "000000" };
    await expect(acceptPublicRecruiterJoin("COMPANY", join, "198.51.100.42"))
      .rejects.toMatchObject({ code: "INVALID" });
    const failures = await pool.query<{ attempts: number }>(
      "SELECT attempts FROM placement_public_join_challenges " +
      "WHERE work_email=$1 ORDER BY created_at DESC LIMIT 1", [email],
    );
    expect(failures.rows[0]?.attempts).toBe(1);
    const accepted = await acceptPublicRecruiterJoin("COMPANY",
      { ...join, code: delivered }, "198.51.100.42");
    expect(accepted).toEqual({ joined: true, outcome: "JOINED" });
    const verified = await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM placement_public_join_challenges " +
      "WHERE work_email=$1 AND verified_at IS NOT NULL", [email],
    );
    expect(verified.rows[0]?.total).toBe(1);
    await expect(acceptPublicRecruiterJoin("COMPANY",
      { ...join, code: delivered }, "198.51.100.42"))
      .rejects.toMatchObject({ code: "INVALID" });
    const grants = await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM placement_recruiter_college_grants g " +
      "JOIN placement_recruiter_profiles p ON p.user_id=g.recruiter_user_id " +
      "WHERE p.company_id=$1 AND g.verification_status='VERIFIED' AND g.status='ACTIVE'",
      [company.id],
    );
    expect(grants.rows[0]?.total).toBe(1);
  });
});
