import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { LoginRepository } from "@/modules/auth/login-service";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Send-cap tests require a disposable TEST_DATABASE_URL");
}
// The repository reads DATABASE_URL; point it at the disposable test database.
process.env.DATABASE_URL = databaseUrl;
const pool = new Pool({ connectionString: databaseUrl, max: 2 });
let repo: LoginRepository;
let closeDb: () => Promise<void>;
const userId = randomUUID();
const RUN = randomUUID().replaceAll("-", "").slice(0, 8);
const fp = (label: string) =>
  createHash("sha256").update(RUN + label).digest("hex");
const limit = {
  windowMinutes: 10,
  perContactAndAddress: 3,
  perContact: 5,
  perAddress: 4,
};

function attempt(contact: string, ipTag: string | null) {
  return repo.createAttempt({
    id: randomUUID(),
    userId,
    collegeId: null,
    contactFingerprint: fp(contact),
    smsCodeMac: "a".repeat(64),
    emailCodeMac: null,
    ipTag,
    rateLimit: limit,
  });
}

beforeAll(async () => {
  repo = (await import("@/modules/auth/login-repository")).drizzleLoginRepository;
  closeDb = (await import("@/db/client")).closeDatabaseConnection;
});

afterAll(async () => {
  await pool.query("DELETE FROM identity_auth_attempts WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  await pool.end();
  await closeDb();
});

describe("database-enforced send caps", () => {
  it("applies per-requester, per-contact and per-address caps", async () => {
    await pool.query(
      "INSERT INTO users (id, identity_uid, phone_e164, email, display_name) VALUES ($1,$2,$3,$4,'Caps')",
      [userId, `cap-${userId}`, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`, `cap-${RUN}@example.test`],
    );

    // Per contact+address: 3 allowed from "x", the 4th refused.
    for (let i = 0; i < 3; i += 1) expect(await attempt("victim", `x${RUN}`)).toBe(true);
    expect(await attempt("victim", `x${RUN}`)).toBe(false);

    // The real user from another address is still served (contact total 4 < 5).
    expect(await attempt("victim", `y${RUN}`)).toBe(true);
    // Contact total reaches 5, so a third address is refused.
    expect(await attempt("victim", `y${RUN}`)).toBe(true);
    expect(await attempt("victim", `z${RUN}`)).toBe(false);

    // Per address across contacts: address "p" may start 4, the 5th is refused.
    for (let i = 0; i < 4; i += 1) expect(await attempt(`other${i}`, `p${RUN}`)).toBe(true);
    expect(await attempt("other9", `p${RUN}`)).toBe(false);

    // A missing address tag falls back to the per-contact rules only.
    expect(await attempt("solo", null)).toBe(true);
  });

  it("holds the cap under concurrent starts", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => attempt("burst", `b${RUN}`)),
    );
    expect(results.filter(Boolean)).toHaveLength(limit.perContactAndAddress);
  });
});
