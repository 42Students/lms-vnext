import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { purgeAuthData } from "@/modules/auth/retention";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Retention tests require a disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const userId = randomUUID();
const fingerprint = "a".repeat(64);

async function attempt(createdHoursAgo: number) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO identity_auth_attempts
       (id, user_id, target_role, contact_fingerprint, created_at, expires_at)
     VALUES ($1,$2,'LEARNER',$3, now() - make_interval(hours => $4),
             now() - make_interval(hours => $4) + interval '5 minutes')`,
    [id, userId, fingerprint, createdHoursAgo],
  );
  return id;
}

async function session(createdDaysAgo: number, lifetimeDays: number, revokedDaysAgo?: number) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO identity_device_sessions
       (id, user_id, credential_digest, created_at, last_seen_at, expires_at,
        revoked_at, revoked_by_user_id)
     VALUES ($1,$2,$3, now() - make_interval(days => $4), now() - make_interval(days => $4),
             now() - make_interval(days => $4) + make_interval(days => $5),
             CASE WHEN $6::int IS NULL THEN NULL ELSE now() - make_interval(days => $6::int) END,
             CASE WHEN $6::int IS NULL THEN NULL ELSE $2::uuid END)`,
    [id, userId, randomUUID().replaceAll("-", "").padEnd(64, "0"), createdDaysAgo, lifetimeDays, revokedDaysAgo ?? null],
  );
  return id;
}

async function exists(table: string, id: string) {
  const r = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);
  return r.rowCount === 1;
}

afterAll(async () => {
  await pool.query("DELETE FROM identity_auth_attempts WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM identity_device_sessions WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  await pool.end();
});

describe("auth data retention", () => {
  it("purges old challenges and long-dead sessions but keeps recent ones", async () => {
    await pool.query(
      "INSERT INTO users (id, identity_uid, phone_e164, email, display_name) VALUES ($1,$2,$3,$4,'Retention')",
      [userId, `ret-${userId}`, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`, `ret-${userId.slice(0, 8)}@example.test`],
    );
    const oldAttempt = await attempt(48);
    const freshAttempt = await attempt(1);
    const oldExpired = await session(90, 30); // expired 60 days ago
    const oldRevoked = await session(60, 365, 45); // revoked 45 days ago
    const recentRevoked = await session(5, 365, 2);
    const active = await session(1, 30);

    const result = await purgeAuthData(pool);
    expect(result.attemptsDeleted).toBeGreaterThanOrEqual(1);
    expect(result.sessionsDeleted).toBeGreaterThanOrEqual(2);

    expect(await exists("identity_auth_attempts", oldAttempt)).toBe(false);
    expect(await exists("identity_auth_attempts", freshAttempt)).toBe(true);
    expect(await exists("identity_device_sessions", oldExpired)).toBe(false);
    expect(await exists("identity_device_sessions", oldRevoked)).toBe(false);
    expect(await exists("identity_device_sessions", recentRevoked)).toBe(true);
    expect(await exists("identity_device_sessions", active)).toBe(true);
  });
});
