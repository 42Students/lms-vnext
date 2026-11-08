import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);

test.describe("UX-G041 college workspace template handoff", () => {
  test.skip(!enabled, "Requires isolated seeded PostgreSQL and ephemeral actor authentication");

  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ] as const) {
    test(`assigned template survives a legacy workspace link and mode switches on ${viewport.name}`,
      async ({ page, context }, info) => {
        test.setTimeout(180_000);
        await authenticateGracefulRole(context, "college");
        await page.setViewportSize(viewport);
        await page.goto("/college/projects/templates");
        await expect(page.getByText("E2E Project Template").first()).toBeVisible();
        await page.getByRole("link", { name: "View & use" }).first().click();
        const templateLink = page.getByRole("link", { name: "Use this template" });
        await expect(templateLink).toBeVisible();
        const target = new URL((await templateLink.getAttribute("href"))!, "http://localhost:3000");
        const templateId = target.searchParams.get("templateId");
        expect(templateId).toMatch(/^[a-f0-9-]{36}$/i);

        await page.goto("/college/projects/workspaces/new?templateId=" + templateId +
          "&mode=cohort&returnTo=https%3A%2F%2Fevil.example");
        await expect(page.getByRole("heading", { level: 1, name: "Create project workspace" })).toBeVisible();
        const current = new URL(page.url());
        expect(current.pathname).toBe("/college/projects/create");
        expect(current.searchParams.get("mode")).toBe("teams");
        expect(current.searchParams.get("templateId")).toBe(templateId);
        expect(current.searchParams.has("returnTo")).toBe(false);
        await expect(page.getByRole("combobox", { name: "Choose a published project template" }))
          .toHaveValue(templateId!);
        for (const [label, mode] of [
          ["Whole class or cohort", "cohort"],
          ["Teams from a class", "teams"],
          ["Single workspace", "single"],
        ] as const) {
          const link = page.getByRole("link", { name: label, exact: true });
          await expect(link).toHaveAttribute("href",
            "/college/projects/create?mode=" + mode + "&templateId=" + templateId);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
        await page.screenshot({ path: info.outputPath("g041-workspace-template-" + viewport.name + ".png"),
          fullPage: true });
      });

    test(`invalid template cannot bypass the college template boundary on ${viewport.name}`,
      async ({ page, context }) => {
        await authenticateGracefulRole(context, "college");
        await page.setViewportSize(viewport);
        await page.goto("/college/projects/workspaces/new?templateId=not-an-assigned-template");
        await expect(page.getByRole("heading", { level: 1, name: "Create project workspace" })).toBeVisible();
        await expect(page.getByRole("combobox", { name: "Choose a published project template" }))
          .not.toHaveValue("not-an-assigned-template");
        await expect(page.getByRole("link", { name: "Whole class or cohort" }))
          .toHaveAttribute("href", "/college/projects/create?mode=cohort");
      });

    test(`saved blocked-workspace directory filter survives on ${viewport.name}`,
      async ({ page, context }, info) => {
        await authenticateGracefulRole(context, "college");
        await page.setViewportSize(viewport);
        await page.goto("/college/projects/workspaces?status=BLOCKED&view=cards&page=1&pageSize=50" +
          "&legacy=discard");
        await expect(page.getByRole("heading", { level: 1, name: "Project workspaces" }))
          .toBeVisible();
        const url = new URL(page.url());
        expect(url.pathname).toBe("/college/projects");
        expect(url.searchParams.get("status")).toBe("BLOCKED");
        expect(url.searchParams.get("view")).toBe("cards");
        expect(url.searchParams.get("pageSize")).toBe("50");
        expect(url.searchParams.has("legacy")).toBe(false);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(2);
        await page.screenshot({path: info.outputPath("g041-workspace-list-" + viewport.name + ".png"),
          fullPage:true});
      });

    test(`learner is denied college workspace creation on ${viewport.name}`, async ({ page, context }) => {
      await authenticateGracefulRole(context, "learner");
      await page.setViewportSize(viewport);
      await page.goto("/college/projects/workspaces/new?templateId=not-assigned", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("combobox", { name: "Choose a published project template" }))
        .toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Create project workspace" }))
        .toHaveCount(0);
    });
  }
});
