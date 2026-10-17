import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  captureUncaughtErrors, expectNoRawErrors, failApi,
  type FailureKind,
} from "./support/no-raw-error";

/**
 * GR-80/GR-82: real production-build UI with separately authenticated,
 * disposable staging accounts. Every mutation is deliberately intercepted.
 * Never generate E2E bypass cookies or accept production credentials here.
 */
const baseURL = process.env.GRACEFUL_PRODUCTION_BASE_URL;
const sessionDir = process.env.GRACEFUL_PRODUCTION_AUTH_STORAGE_DIR;

const actions = [
  {
    role: "learner", route: "/learn/my-placements",
    field: "#placement-job-preferences input", button: "Save preferences",
    endpoint: "/api/placements/preferences", method: "PUT",
    value: "Staging failure must preserve learner preferences",
  },
  {
    role: "college", route: "/college/departments",
    field: "#department-name", button: "Create Department",
    endpoint: "/api/college/departments", method: "POST",
    value: "Staging failure must preserve college department",
  },
  {
    role: "recruiter", route: "/hr/profile",
    field: "#hr-recruiter-designation", button: "Save designation",
    endpoint: "/api/placements/recruiter/profile", method: null,
    value: "Staging failure must preserve designation",
  },
  {
    role: "superadmin", route: "/admin/organizations",
    field: "#organization-name", button: "Create Organization",
    endpoint: "/api/organizations", method: "POST",
    value: "Staging failure must preserve organization",
  },
] as const;

const faultKinds: readonly FailureKind[] = [
  "backend-down", "html-502", "json-500", "forbidden",
  "missing-record", "conflict", "rate-limit", "maintenance", "slow",
];

for (const action of actions) {
  for (const kind of faultKinds) {
    test(`GR-80 GR-82 production ${action.role} save ${kind} keeps a real editable form`,
      async ({ browser }) => {
        test.setTimeout(50_000);
        const stateFile = sessionDir ? path.join(sessionDir, action.role + ".json") : "";
        test.skip(!baseURL || !sessionDir || !existsSync(stateFile),
          `GR-80 GR-82 requires real signed-in staging session: ${action.role}`);

        const context = await browser.newContext({ baseURL: baseURL!, storageState: stateFile });
        try {
          const page = await context.newPage();
          const pageErrors = captureUncaughtErrors(page);
          await page.goto(action.route);
          await expect(page).toHaveURL(new RegExp(action.route.replace(/\//g, "\\/") + "(?:\\?|$)"));
          const field = page.locator(action.field).first();
          await expect(field, `Expected real ${action.role} form, not a sign-in redirect`).toBeVisible();
          await field.fill(action.value);
          const fault = await failApi(page,
            kind === "backend-down" ? "**/api/**" : "**" + action.endpoint, kind);
          try {
            await page.getByRole("button", { name: action.button, exact: true }).click();
            await expect.poll(() => fault.requests().filter(request =>
              request.endsWith(" " + action.endpoint)).length).toBe(1);
            const mutations = fault.requests().filter(request =>
              request.endsWith(" " + action.endpoint));
            expect(mutations).toHaveLength(1);
            if (action.method) {
              expect(mutations[0]).toBe(action.method + " " + action.endpoint);
            } else {
              expect(mutations[0]).toMatch(/^(?:POST|PUT|PATCH) /);
            }

            // Status-specific/domain copy is allowed when it is intentional and
            // safe, but raw API strings and HTML proxy bodies must not render.
            await expect(page.getByRole("alert").filter({
              hasText: /try again|could not|cannot|not created|already exists|permission|wait|changed|connection/i,
            }).first()).toBeVisible({ timeout: 15_000 });
            await expect(field).toHaveValue(action.value);
            await expect(page.getByRole("button", { name: action.button, exact: true }))
              .toBeEnabled({ timeout: 15_000 });
            await expectNoRawErrors(page);
            expect(pageErrors).toEqual([]);
          } finally {
            await fault.dispose();
          }
        } finally {
          await context.close();
        }
      });
  }
}
