import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const size of viewports) {
  test("UX-G060 "+size.name+": malformed learner assignment bookmark is recoverable", async ({ page, context }, info) => {
    await authenticateGracefulRole(context, "learner");
    await page.setViewportSize(size);
    await page.goto("/learn/assignments?course=not-a-uuid&page=3");
    const alert = page.getByRole("alert").filter({ hasText: "Check your assignment link" });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("link", { name: "View all assignments" }))
      .toHaveAttribute("href", "/learn/allAssignments");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("g060-assignment-"+size.name+".png"), fullPage: true });
  });

  test("UX-G060 "+size.name+": invalid schedule filter offers clear navigation", async ({ page, context }, info) => {
    await authenticateGracefulRole(context, "learner");
    await page.setViewportSize(size);
    await page.goto("/learn/calendar?month=2026-13");
    const alert = page.getByRole("alert").filter({ hasText: "Invalid calendar filters" });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("link", { name: "Clear calendar filters" }))
      .toHaveAttribute("href", "/learn/calendar");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("g060-schedule-"+size.name+".png"), fullPage: true });
  });

  test("UX-G060 "+size.name+": repeated attendance selectors never choose a hidden first value", async ({ page, context }, info) => {
    await authenticateGracefulRole(context, "learner");
    await page.setViewportSize(size);
    await page.goto("/learn/attendance/calendar?status=PRESENT&status=ABSENT");
    const alert = page.getByRole("alert").filter({ hasText: "Invalid attendance calendar filters" });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("link", { name: "Clear filters" }))
      .toHaveAttribute("href", "/learn/attendance/calendar");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("g060-attendance-"+size.name+".png"), fullPage: true });
  });

  test("UX-G060 "+size.name+": conflicting course lesson bookmark gives safe recovery", async ({ page, context }, info) => {
    await authenticateGracefulRole(context, "learner");
    await page.setViewportSize(size);
    await page.goto("/learn/courses/81818181-8181-4818-8818-818181818181?lesson=one&lesson=two");
    const alert = page.getByRole("alert").filter({ hasText: "Conflicting course link filters" });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("link", { name: "View my courses" }))
      .toHaveAttribute("href", "/learn/courses");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("g060-course-"+size.name+".png"), fullPage: true });
  });
}

test("UX-G060: faculty cannot see private learner recovery states", async ({ page, context }) => {
  await authenticateGracefulRole(context, "faculty");
  await page.goto("/learn/assignments?course=not-a-uuid");
  await expect(page.getByText("Check your assignment link")).toHaveCount(0);
  await page.goto("/learn/attendance/calendar?status=PRESENT&status=ABSENT");
  await expect(page.getByText("Invalid attendance calendar filters")).toHaveCount(0);
});

for (const size of viewports) {
  test("UX-G060 "+size.name+": ordinary learner assignment and attendance journeys remain usable", async ({ page, context }, info) => {
    await authenticateGracefulRole(context, "learner");
    await page.setViewportSize(size);

    // The backward-compatible bookmark forwards to the real, authorized list.
    await page.goto("/learn/assignments");
    await expect(page).toHaveURL(/\/learn\/allAssignments(?:\?|$)/);
    await expect(page.getByRole("heading", { level: 1, name: "All Assignments" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("g060-normal-assignments-"+size.name+".png"), fullPage: true });

    // Do not certify invalid-query recovery alone: the usable calendar must
    // still render from a learner's actual seeded, tenant-scoped request.
    await page.goto("/learn/attendance/calendar");
    await expect(page.getByRole("heading", { level: 1, name: "Attendance calendar" })).toBeVisible();
    if (size.name === "mobile") {
      // Shared FilterBar deliberately moves its form into an accessible
      // responsive drawer below 768px; open the drawer before checking fields.
      const launcher = page.getByRole("button", { name: "Filters", exact: true });
      await expect(launcher).toBeVisible();
      await launcher.click();
      const drawer = page.getByRole("dialog", { name: "Filters" });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("button", { name: "Apply filters" })).toBeVisible();
      await page.screenshot({ path: info.outputPath("g060-attendance-filters-mobile.png"), fullPage: true });
      await drawer.getByRole("button", { name: "Close drawer" }).click();
      await expect(drawer).not.toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Apply filters" })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Attendance detail" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("g060-normal-attendance-"+size.name+".png"), fullPage: true });
  });
}
