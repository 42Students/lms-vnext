/**
 * P04 auth setup: create persistent storage-state files for all 7 test roles.
 *
 * Mechanism: APP_ENV=development + AUTH_TEST_OTP=135790 lets emails listed in
 * AUTH_TEST_EMAILS skip real OTP delivery. This file drives the REST API
 * directly (no browser clicks) so UI changes never break auth setup.
 *
 * Run once before the visual-parity specs:
 *   npx playwright test --project=visual-parity-setup
 *
 * The resulting JSON files are committed to tests/.auth/ only in .gitignore
 * exclusion is removed; by default they are gitignored.
 */

import * as fs from "fs";
import * as path from "path";
import { test as setup, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEV_HOST =
  process.env.TEST_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://testa.development.42lms.com";

/** Must be set via AUTH_TEST_OTP env var — matches the value in the cluster vnext-auth secret. */
const TEST_OTP = process.env.AUTH_TEST_OTP ?? "";

const AUTH_DIR = path.join(__dirname, ".auth");

// Ensure .auth directory exists before any test saves there
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Core login helper
// ---------------------------------------------------------------------------

type MembershipEntry = {
  id: string;
  status: string;
  roles: string[];
  collegeName?: string;
};

/**
 * Complete the full OTP login flow for one email via the API.
 * After this call the browser context's cookie jar holds:
 *   lms_session  — authenticated session
 *   lms_membership — pre-selected when a single active membership exists
 *
 * If membership selection is still required (e.g. super-admin or multi-college
 * accounts), pass `preferredRole` and the helper will POST to /api/auth/memberships
 * to pick the right one.
 */
async function loginViaApi(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  preferredRole?: string | null,
): Promise<void> {
  const origin = DEV_HOST;

  // --- Step 1: start login attempt ---
  const startRes = await request.post(`${DEV_HOST}/api/auth/login/start`, {
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    data: { channel: "EMAIL", email },
  });

  const startText = await startRes.text();
  expect(
    startRes.ok(),
    `login/start failed for ${email} (${startRes.status()}): ${startText}`,
  ).toBe(true);

  const startBody = JSON.parse(startText) as { attemptId: string };
  const { attemptId } = startBody;

  // --- Step 2: verify OTP (with automatic second-factor handling for super-admins) ---
  // First attempt — super-admins return SECOND_FACTOR_REQUIRED on this call.
  const verify1Res = await request.post(`${DEV_HOST}/api/auth/login/verify`, {
    headers: { "Content-Type": "application/json", Origin: origin },
    data: { attemptId, code: TEST_OTP },
  });
  const verify1Text = await verify1Res.text();

  let verifyRes = verify1Res;
  let verifyText = verify1Text;

  if (verify1Res.status() === 401) {
    const body1 = JSON.parse(verify1Text) as { error?: string };
    if (body1.error === "SECOND_FACTOR_REQUIRED") {
      // The email second-factor code was already issued at login/start time.
      // For test accounts both factors share the same TEST_OTP value.
      const verify2Res = await request.post(`${DEV_HOST}/api/auth/login/verify`, {
        headers: { "Content-Type": "application/json", Origin: origin },
        data: { attemptId, code: TEST_OTP, secondCode: TEST_OTP },
      });
      verifyRes = verify2Res;
      verifyText = await verify2Res.text();
    }
  }

  expect(
    verifyRes.ok(),
    `login/verify failed for ${email} (${verifyRes.status()}): ${verifyText}`,
  ).toBe(true);

  const verifyBody = JSON.parse(verifyText) as {
    membershipSelectionRequired?: boolean;
    selectedMembership?: boolean;
  };

  // --- Step 3: select membership if required ---
  if (verifyBody.membershipSelectionRequired && preferredRole) {
    const membershipsRes = await request.get(
      `${DEV_HOST}/api/auth/memberships`,
      { headers: { Origin: origin } },
    );

    const membershipsText = await membershipsRes.text();
    expect(
      membershipsRes.ok(),
      `memberships list failed for ${email}: ${membershipsText}`,
    ).toBe(true);

    const membershipsBody = JSON.parse(membershipsText) as {
      memberships: MembershipEntry[];
    };

    const match = membershipsBody.memberships?.find(
      (m) => m.status === "ACTIVE" && m.roles?.includes(preferredRole!),
    );

    if (match) {
      const switchRes = await request.post(
        `${DEV_HOST}/api/auth/memberships`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: origin,
          },
          data: { membershipId: match.id, role: preferredRole },
        },
      );
      const switchText = await switchRes.text();
      expect(
        switchRes.ok(),
        `membership switch failed for ${email} → ${preferredRole}: ${switchText}`,
      ).toBe(true);
    } else {
      console.warn(
        `[auth.setup] No ACTIVE ${preferredRole} membership found for ${email}; ` +
          `proceeding without explicit membership selection`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Setup tests — one per role
// ---------------------------------------------------------------------------

setup("authenticate as learner", async ({ request, browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  await loginViaApi(req, "learner.a@vnext.test", "LEARNER");
  await ctx.storageState({ path: path.join(AUTH_DIR, "learner.json") });
  await ctx.close();
});

setup("authenticate as faculty", async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  await loginViaApi(req, "faculty.a@vnext.test", "FACULTY");
  await ctx.storageState({ path: path.join(AUTH_DIR, "faculty.json") });
  await ctx.close();
});

setup("authenticate as mentor", async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  await loginViaApi(req, "mentor.a@vnext.test", "MENTOR");
  await ctx.storageState({ path: path.join(AUTH_DIR, "mentor.json") });
  await ctx.close();
});

setup("authenticate as admin", async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  await loginViaApi(req, "admin.a@vnext.test", "COLLEGE_ADMIN");
  await ctx.storageState({ path: path.join(AUTH_DIR, "admin.json") });
  await ctx.close();
});

setup("authenticate as tpo", async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  await loginViaApi(req, "tpo.a@vnext.test", "TPO");
  await ctx.storageState({ path: path.join(AUTH_DIR, "tpo.json") });
  await ctx.close();
});

setup("authenticate as hr", async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  // HR is a platform-level grant, not a college membership role.
  // Login without role selection — the session cookie is sufficient.
  await loginViaApi(req, "hr@vnext.test", null);
  await ctx.storageState({ path: path.join(AUTH_DIR, "hr.json") });
  await ctx.close();
});

setup("authenticate as superadmin", async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = ctx.request;
  // Super-admin: systemWorkspaceAvailable=true; no membership cookie needed
  // for /admin/* routes. Skip membership selection.
  await loginViaApi(req, "superadmin@vnext.test", null);
  await ctx.storageState({ path: path.join(AUTH_DIR, "superadmin.json") });
  await ctx.close();
});
