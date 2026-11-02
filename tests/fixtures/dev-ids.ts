/**
 * dev-ids.ts — fetch real record IDs for the TESTA college from either:
 *   1. Local DB at DATABASE_URL (postgres direct, fastest)
 *   2. Deployed dev API at TEST_BASE_URL (fallback via authenticated HTTP)
 *
 * Output: tests/fixtures/dev-ids.json
 *
 * Usage (run directly with ts-node / tsx / bun):
 *   bun tests/fixtures/dev-ids.ts
 *   npx tsx tests/fixtures/dev-ids.ts
 *
 * The script is NOT a Playwright test. Run it once to generate the JSON fixture
 * that dynamic-route visual-parity tests import.
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DevIds = {
  /** UUID of the TESTA college */
  collegeId: string;
  /** Any active course delivery in TESTA */
  deliveryId: string | null;
  /** Any active placement job in TESTA */
  jobId: string | null;
  /** Any project workspace in TESTA */
  workspaceId: string | null;
  /** Membership ID of learner.a@vnext.test */
  membershipId: string | null;
  /** Any placement application in TESTA */
  applicationId: string | null;
  /** Source used to populate these IDs */
  _source: "db" | "api" | "seed-fallback";
  /** When the file was generated */
  _generatedAt: string;
};

// ---------------------------------------------------------------------------
// Seed-data fallback (local e2e DB well-known IDs from scripts/db-seed-data.ts)
// These are correct for the local e2e test DB. Use only if neither DB nor API
// is available.
// ---------------------------------------------------------------------------

const SEED_FALLBACK: Omit<DevIds, "_source" | "_generatedAt"> = {
  collegeId: "20000000-0000-4000-8000-000000000001",
  deliveryId: null,
  jobId: null,
  workspaceId: null,
  membershipId: "40000000-0000-4000-8000-000000000004",
  applicationId: null,
};

// ---------------------------------------------------------------------------
// DB path
// ---------------------------------------------------------------------------

async function fromDb(dbUrl: string): Promise<DevIds | null> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require("pg") as typeof import("pg");
  const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 5000 });

  try {
    await client.connect();
  } catch (err) {
    console.warn("[dev-ids] DB not reachable:", (err as Error).message);
    return null;
  }

  try {
    // College where short_name matches 'testa' or is the first seeded college
    const collegeRow = await client.query<{ id: string }>(
      `SELECT id FROM colleges
       WHERE short_name ILIKE 'testa' OR short_name ILIKE 'test-a'
       ORDER BY created_at ASC LIMIT 1`,
    );
    const collegeId: string =
      collegeRow.rows[0]?.id ?? SEED_FALLBACK.collegeId;

    // Course delivery
    const deliveryRow = await client.query<{ id: string }>(
      `SELECT id FROM course_deliveries
       WHERE college_id = $1 AND status = 'ACTIVE'
       ORDER BY created_at DESC LIMIT 1`,
      [collegeId],
    );

    // Placement job
    const jobRow = await client.query<{ id: string }>(
      `SELECT j.id FROM placement_jobs j
       JOIN placement_job_college_scope s ON s.job_id = j.id
       WHERE s.college_id = $1
       ORDER BY j.created_at DESC LIMIT 1`,
      [collegeId],
    );

    // Project workspace
    const workspaceRow = await client.query<{ id: string }>(
      `SELECT id FROM projects
       WHERE college_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [collegeId],
    );

    // Learner membership
    const membershipRow = await client.query<{ id: string }>(
      `SELECT m.id FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE u.email = 'learner.a@vnext.test'
         AND m.college_id = $1
       LIMIT 1`,
      [collegeId],
    );

    // Application
    const applicationRow = await client.query<{ id: string }>(
      `SELECT pa.id FROM placement_applications pa
       JOIN memberships m ON m.id = pa.membership_id
       WHERE m.college_id = $1
       ORDER BY pa.created_at DESC LIMIT 1`,
      [collegeId],
    );

    return {
      collegeId,
      deliveryId: deliveryRow.rows[0]?.id ?? null,
      jobId: jobRow.rows[0]?.id ?? null,
      workspaceId: workspaceRow.rows[0]?.id ?? null,
      membershipId: membershipRow.rows[0]?.id ?? null,
      applicationId: applicationRow.rows[0]?.id ?? null,
      _source: "db",
      _generatedAt: new Date().toISOString(),
    };
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// API path (uses superadmin session from tests/.auth/superadmin.json)
// ---------------------------------------------------------------------------

async function fromApi(baseUrl: string): Promise<DevIds | null> {
  const authFile = path.join(__dirname, "..", ".auth", "superadmin.json");
  if (!fs.existsSync(authFile)) {
    console.warn("[dev-ids] No superadmin.json; run auth.setup first for API path");
    return null;
  }

  const authState = JSON.parse(fs.readFileSync(authFile, "utf8")) as {
    cookies: Array<{ name: string; value: string; domain: string; path: string; secure: boolean; httpOnly: boolean; sameSite: string }>;
  };

  // Build a Cookie header from saved state
  const cookieHeader = authState.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers: Record<string, string> = {
    Cookie: cookieHeader,
    Origin: baseUrl,
  };

  async function apiGet(pathname: string) {
    const res = await fetch(`${baseUrl}${pathname}`, { headers });
    if (!res.ok) return null;
    return res.json() as Promise<unknown>;
  }

  // Fetch college list
  const collegesData = await apiGet("/api/v1/colleges?limit=1") as {
    colleges?: Array<{ id: string }>;
  } | null;

  // The /api/v1 path may not exist; try internal API
  const membershipsData = await apiGet("/api/auth/memberships") as {
    memberships?: Array<{ id: string; collegeId?: string; collegeName?: string }>;
  } | null;

  if (!membershipsData?.memberships?.length && !collegesData?.colleges?.length) {
    console.warn("[dev-ids] API returned no usable data");
    return null;
  }

  // Extract college from memberships list (superadmin has access to college info)
  const colleges = membershipsData?.memberships ?? [];
  const testa = colleges.find(
    (m) =>
      m.collegeName?.toLowerCase().includes("testa") ||
      m.collegeName?.toLowerCase().includes("test a") ||
      m.collegeName?.toLowerCase() === "a",
  );

  const collegeId =
    testa?.collegeId ??
    collegesData?.colleges?.[0]?.id ??
    SEED_FALLBACK.collegeId;

  // Try to get a delivery
  const deliveriesData = await apiGet(
    `/api/courses/deliveries?collegeId=${collegeId}&limit=1`,
  ) as { deliveries?: Array<{ id: string }> } | null;

  return {
    collegeId,
    deliveryId: deliveriesData?.deliveries?.[0]?.id ?? null,
    jobId: null,
    workspaceId: null,
    membershipId: null,
    applicationId: null,
    _source: "api",
    _generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const outFile = path.join(__dirname, "dev-ids.json");
  const dbUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:54329/lms_vnext_e2e";
  const baseUrl =
    process.env.TEST_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "https://testa.development.42lms.com";

  console.log("[dev-ids] Trying DB at", dbUrl);
  let result = await fromDb(dbUrl);

  if (!result) {
    console.log("[dev-ids] DB unavailable; trying API at", baseUrl);
    result = await fromApi(baseUrl);
  }

  if (!result) {
    console.warn("[dev-ids] Both DB and API unavailable; using seed fallback IDs");
    result = {
      ...SEED_FALLBACK,
      _source: "seed-fallback",
      _generatedAt: new Date().toISOString(),
    };
  }

  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log("[dev-ids] Written to", outFile);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("[dev-ids] Fatal:", err);
  process.exit(1);
});
