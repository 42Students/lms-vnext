import { expect, test, type BrowserContext } from "@playwright/test";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const origin = "http://localhost:3000";
const secret = process.env.E2E_AUTH_SECRET;

/**
 * Real server-rendered state and permission tests, not source-only contracts.
 * The dedicated Mentor workflow prepares its own disposable PostgreSQL fixture.
 */
async function signIn(
  context: BrowserContext,
  identityUid: string,
  membershipId: string,
  role: "MENTOR" | "COLLEGE_ADMIN" | "TPO" = "MENTOR",
) {
  if (!secret) throw new Error("E2E_AUTH_SECRET required");
  await context.clearCookies();
  await context.addCookies([
    { name: E2E_IDENTITY_COOKIE_NAME, value: identityUid, url: origin, httpOnly: true, sameSite: "Lax" },
    { name: E2E_SECRET_COOKIE_NAME, value: secret, url: origin, httpOnly: true, sameSite: "Lax" },
    { name: "lms_membership", value: membershipId, url: origin, httpOnly: true, sameSite: "Lax" },
    { name: "lms_role", value: role, url: origin, httpOnly: true, sameSite: "Lax" },
  ]);
}

test.describe("Mentor #45, #53 and #56 authenticated portfolio state acceptance", () => {
  test.skip(!secret, "Requires disposable authenticated browser fixture");

  test("report search persists a keyboard-submitted filter and renders a genuine empty result", async ({ page, context }) => {
    await signIn(context, "seed-shared-faculty", SEED_IDS.facultyCollegeAMembership);
    await page.goto("/mentor/reports");
    await expect(page.getByRole("heading", { level: 1, name: "Assigned project reports" })).toBeVisible();
    const form = page.getByRole("search", { name: "mentor reports filters" });
    const unmatched = "unmatched-mentor-report-" + Date.now();
    await form.locator('input[name="search"]').fill(unmatched);
    await form.locator('input[name="search"]').press("Enter");
    await expect(page).toHaveURL(new RegExp("search=" + unmatched));
    await expect(page.getByText("No assigned projects match")).toBeVisible();
    await expect(page.getByText("0 projects match these filters.")).toBeVisible();
    await page.goto("/mentor/reports?status=INVALID");
    await expect(page.getByText("Invalid mentor report filters")).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear filters" }))
      .toHaveAttribute("href", "/mentor/reports");
  });

  test("mentor report CSV stays a bounded scoped export, never an unfiltered person dump", async ({ page, context }) => {
    await signIn(context, "seed-shared-faculty", SEED_IDS.facultyCollegeAMembership);
    const response = await page.request.get("/api/mentor/reports/export?status=ALL");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(Number(response.headers()["x-export-omitted"])).toBeGreaterThanOrEqual(0);
    const csv = await response.text();
    expect(csv).toContain("Project ID,Project,Status,Primary Mentor,Recorded attention,Updated (IST)");
    expect(csv).not.toContain("identity_uid");
    expect(csv).not.toContain("phone_e164");
  });

  test("review decisions, search empty/invalid states and recovery remain navigable", async ({ page, context }) => {
    await signIn(context, "seed-shared-faculty", SEED_IDS.facultyCollegeAMembership);
    await page.goto("/mentor/review-history?decision=APPROVED");
    await expect(page.getByRole("heading", { level: 1, name: "Delivery review history" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error: a server-side exception");
    await page.goto("/mentor/review-history?decision=INVALID");
    await expect(page.getByText("Invalid review history filters")).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear filters" }))
      .toHaveAttribute("href", "/mentor/review-history");

    await page.goto("/mentor/search");
    await expect(page.locator(".prototype-mentor-search-page").getByRole("status")).toContainText("Enter a search term");
    const search = page.locator("#mentor-unified-search");
    const unmatched = "missing-mentor-work-" + Date.now();
    await search.fill(unmatched);
    await search.press("Enter");
    await expect(page).toHaveURL(new RegExp("q=" + unmatched));
    await expect(page.locator(".prototype-mentor-search-page").getByRole("status"))
      .toContainText("No matching projects, tasks, students or resources");
    await page.goto("/mentor/search?q=hello&page=not-a-page");
    const searchSurface = page.locator(".prototype-mentor-search-page");
    await expect(searchSurface.getByRole("alert"))
      .toContainText("with a valid results page");
    await expect(searchSurface.getByRole("status")).toHaveCount(0);
    await page.goto("/mentor/search?q=hello&q=world");
    await expect(searchSurface.getByRole("alert"))
      .toContainText("with a valid results page");
    await expect(searchSurface.getByRole("status")).toHaveCount(0);
  });

  test("college administrators and selected TPOs cannot read Mentor report screens or export", async ({ page, context }) => {
    for (const actor of [
      { uid: "seed-college-admin", membership: SEED_IDS.collegeAdminMembership, role: "COLLEGE_ADMIN" as const },
      { uid: "seed-shared-faculty", membership: SEED_IDS.facultyCollegeAMembership, role: "TPO" as const },
    ]) {
      await signIn(context, actor.uid, actor.membership, actor.role);
      for (const path of [
        "/mentor/reports", "/mentor/review-history", "/mentor/search",
        "/mentor/account", "/mentor/notifications",
      ]) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
      }
      const denied = await page.request.get("/api/mentor/reports/export?status=ALL");
      expect(denied.status()).toBe(403);
      expect((await denied.json() as {error?:string}).error).toBe("PROJECT_ACCESS_DENIED");
    }
  });

  test("activity, pending reviews and reviewed deliveries have keyboard-filtered empty and recovery states", async ({ page, context }) => {
    await signIn(context, "seed-shared-faculty", SEED_IDS.facultyCollegeAMembership);
    const unmatched = "mentor-browser-unmatched-" + Date.now();
    const surfaces = [
      { path: "/mentor/activity", form: "Mentor project activity filters", empty: "No recorded activity" },
      { path: "/mentor/reviews", form: "mentor reviews filters", empty: "No deliveries awaiting review" },
      { path: "/mentor/review-history", form: "mentor review history filters", empty: "No recorded delivery reviews" },
    ] as const;
    for (const surface of surfaces) {
      await page.goto(surface.path);
      const form = page.getByRole("search", { name: surface.form });
      const search = form.locator('input[name="search"]');
      await search.fill(unmatched);
      await search.press("Enter");
      await expect(page).toHaveURL(new RegExp("search=" + unmatched));
      await expect(page.getByText(surface.empty, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Clear", exact: true }).first())
        .toHaveAttribute("href", surface.path);
      await page.goto(surface.path);
      await expect(page.getByRole("search", { name: surface.form })).toBeVisible();
    }
    for (const [path, expected] of [
      ["/mentor/activity?view=INVALID", "Invalid activity filters"],
      ["/mentor/reviews?age=INVALID", "Invalid review filters"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: expected })).toBeVisible();
      await expect(page.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
        "href", path.split("?")[0],
      );
    }
  });

  test("calendar keyword filtering and notification category tabs preserve real empty and selected states", async ({ page, context }) => {
    await signIn(context, "seed-shared-faculty", SEED_IDS.facultyCollegeAMembership);
    await page.goto("/mentor/calendar");
    await expect(page.getByRole("heading", { name: "Meetings", level: 1 })).toBeVisible();
    const disclosure = page.locator('details[data-slot="disclosure"]')
      .filter({ has: page.locator('summary', { hasText: "Search & filters" }) }).first();
    await disclosure.locator("summary").click();
    const keyword = "unmatched-mentor-calendar-" + Date.now();
    const search = page.locator('input[name="search"][form="mentor-calendar-filters"]');
    await search.fill(keyword);
    await search.press("Enter");
    await expect(page).toHaveURL(new RegExp("search=" + keyword));
    await expect(page.getByText(/^0 matching meetings of \d+ currently assigned\.$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear", exact: true }).first())
      .toHaveAttribute("href", "/mentor/calendar");

    await page.goto("/mentor/notifications?pill=tasks");
    let tabs = page.getByRole("navigation", { name: "Notification categories" });
    await expect(tabs.getByRole("link", { name: "Tasks and teams" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "Meetings" }).click();
    await expect(page).toHaveURL(/\/mentor\/notifications\?pill=meet$/);
    tabs = page.getByRole("navigation", { name: "Notification categories" });
    await expect(tabs.getByRole("link", { name: "Meetings" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "All", exact: true }).click();
    await expect(page).toHaveURL(/\/mentor\/notifications$/);
  });

  test("unified search keyboard submits a real assigned project and opens its scoped overview", async ({ page, context }) => {
    test.skip(process.env["MENTOR_E2E_SEED_PROJECT"] !== "true", "Requires dedicated persisted Mentor fixture");
    await signIn(context, "seed-shared-faculty", SEED_IDS.facultyCollegeAMembership);
    await page.goto("/mentor/search");
    const search = page.locator("#mentor-unified-search");
    await search.focus();
    await expect(search).toBeFocused();
    await search.fill("E2E Mentor Acceptance Project");
    await search.press("Enter");
    await expect(page).toHaveURL(/q=E2E/);
    const project = page.getByRole("link", { name: /E2E Mentor Acceptance Project/ }).first();
    await expect(project).toBeVisible();
    await project.click();
    await expect(page).toHaveURL(/\/mentor\/projects\/[0-9a-f-]{36}\?tab=overview$/i);
    await expect(page.getByRole("heading", { name: "E2E Mentor Acceptance Project", level: 1 })).toBeVisible();
  });
});
