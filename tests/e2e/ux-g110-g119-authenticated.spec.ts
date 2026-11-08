import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

/** Real protected Next.js routes, not the development-only recovery fixture. */
const cases = [
  { group: "UX-G110", name: "duplicate scheduling windows", path: "/tpo/placements/schedule-conflicts?days=7&days=14", heading: "Invalid scheduling window", body: "Repeated days filters were ignored", action: "Reset window", href: "/tpo/placements/schedule-conflicts" },
  { group: "UX-G111", name: "ambiguous recruiter directory", path: "/tpo/recruiters?view=table&view=board", heading: "Conflicting recruiter filters", body: "No recruiter results were loaded", action: "Clear recruiter filters", href: "/tpo/recruiters" },
  { group: "UX-G111", name: "ambiguous email history", path: "/tpo/recruiters/campaigns?page=1&page=2", heading: "Emails", body: "No campaign history was loaded", action: "Clear filters", href: "/tpo/recruiters/campaigns" },
  { group: "UX-G112", name: "ambiguous audience preview", path: "/tpo/recruiters/campaigns/preview?segment=NEW&segment=UNASSIGNED", heading: "Audience preview", body: "No recipients were queried", action: "Reset segment", href: "/tpo/recruiters/campaigns/preview" },
  { group: "UX-G112", name: "ambiguous after-college filter", path: "/tpo/reports/after-college?batchId=first&batchId=second", heading: "Invalid report filters", body: "No report records were loaded", action: "Clear filters", href: "/tpo/reports/after-college" },
  { group: "UX-G113", name: "invalid placement-season bookmark", path: "/tpo/reports/branch-season?seasonId=not-a-uuid", heading: "Invalid season filter", body: "No branch report was loaded", action: "Clear season filter", href: "/tpo/reports/branch-season" },
  { group: "UX-G118", name: "ambiguous team sort", path: "/tpo/settings/team?sort=WORK&sort=NAME", heading: "Invalid team sorting", body: "No team records were loaded", action: "Clear sort", href: "/tpo/settings/team" },
  { group: "UX-G118", name: "ambiguous student history page", path: "/tpo/students/00000000-0000-4000-8000-000000000001/history?page=1&page=2", heading: "Invalid history page", body: "No learner history was loaded", action: "Clear page filter", href: "/tpo/students/00000000-0000-4000-8000-000000000001/history" },
  { group: "UX-G119", name: "ambiguous preparation queue page", path: "/tpo/students/preparation-prep?page=1&page=2", heading: "Learners needing preparation support", body: "No learner roster was loaded", action: "Reset page", href: "/tpo/students/preparation-prep" },
  { group: "UX-G119", name: "ambiguous private conversation references", path: "/tpo/team/00000000-0000-4000-8000-000000000001?page=1&page=2", heading: "Conflicting conversation filters", body: "No private messages were loaded", action: "Clear conversation filters", href: "/tpo/team/00000000-0000-4000-8000-000000000001" },
] as const;

/** G117: all six settings destinations, with actual scoped reads and panels. */
const settingsRoutes = [
  { segment: "public-link", title: "Public recruiter link" },
  { segment: "public-page", title: "Public placements" },
  { segment: "recruiters", title: "Recruiter access" },
  { segment: "rules", title: "Settings" },
  { segment: "season", title: "Placement Season" },
  { segment: "see", title: "What companies see" },
] as const;

const sizes = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.describe("TPO UX G110–G119: authenticated route recovery and tenant-safe read gating", () => {
  // This suite must fail when the disposable seeded test environment is absent.
  test.beforeAll(() => {
    if (process.env.E2E_AUTH_ENABLED !== "true" || !process.env.E2E_AUTH_SECRET || !process.env.E2E_DATABASE_URL) {
      throw new Error("Disposable seeded PostgreSQL and E2E_AUTH_SECRET are required; no unauthenticated fallback");
    }
  });
  for (const size of sizes) {
    for (const scenario of cases) {
      test(`${scenario.group} ${size.name}: ${scenario.name}`, async ({ page, context }, info) => {
        test.setTimeout(120_000);
        await authenticateGracefulRole(context, "tpo");
        await page.setViewportSize(size);
        const runtimeErrors: string[] = [];
        page.on("pageerror", error => runtimeErrors.push(error.message));
        const response = await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
        expect(response?.status()).toBe(200);
        await expect(page).toHaveURL(new RegExp(scenario.path.split("?")[0]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await expect(page.getByRole("heading", { name: scenario.heading }).first()).toBeVisible();
        await expect(page.getByText(scenario.body, { exact: false }).first()).toBeVisible();
        const exit = page.getByRole("link", { name: scenario.action }).first();
        await expect(exit).toHaveAttribute("href", scenario.href);
        await exit.focus();
        await expect(exit).toBeFocused();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
        expect(runtimeErrors).toEqual([]);
        await page.screenshot({ path: info.outputPath(`${scenario.group}-${size.name}-${scenario.name.replaceAll(" ", "-")}.png`), fullPage: true });
      });
    }
    for (const route of settingsRoutes) {
      test(`UX-G117 ${size.name}: genuine TPO settings/${route.segment} view`, async ({ page, context }, info) => {
        test.setTimeout(120_000);
        await authenticateGracefulRole(context, "tpo");
        await page.setViewportSize(size);
        const destination = "/tpo/settings/" + route.segment;
        const response = await page.goto(destination, { waitUntil: "domcontentloaded" });
        expect(response?.status()).toBe(200);
        expect(new URL(page.url()).pathname).toBe(destination);
        await expect(page.getByRole("heading", { name: route.title, level: 1 })).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Placement settings sections" })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
        await page.screenshot({ path: info.outputPath(`g117-${route.segment}-${size.name}.png`), fullPage: true });
      });
    }
    test(`${size.name}: learner cannot access TPO private recovery pages`, async ({ page, context }, info) => {
      test.setTimeout(120_000);
      await authenticateGracefulRole(context, "learner");
      await page.setViewportSize(size);
      for (const path of [
        "/tpo/placements/schedule-conflicts?days=7&days=14",
        "/tpo/recruiters?view=table&view=board",
        "/tpo/reports/branch-season?seasonId=not-a-uuid",
        "/tpo/settings/team?sort=WORK&sort=NAME",
        "/tpo/students/preparation-prep?page=1&page=2",
      ]) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(/\/(?:dashboard(?:[?#]|$)|learn\/courses\?access=denied(?:&|$))/);
        await expect(page.getByText("No team records were loaded")).toHaveCount(0);
        await expect(page.getByText("No recruiter results were loaded")).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
      await page.screenshot({ path: info.outputPath(`learner-denial-${size.name}.png`), fullPage: true });
    });
  }
});
