import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

test.describe("UX-G004 Activity Log journey", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires isolated seeded authenticated browser test database");

  test("super-admin filters preserve investigative context and use inclusive date presets", async ({ page, context }) => {
    await authenticateGracefulRole(context, "superadmin");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/activity?view=all&range=ALL&q=offer&actorName=Asha&eventType=placements.offer.issued");
    await expect(page.getByRole("heading", {name:"Activity Log",level:1})).toBeVisible();
    const nav = page.getByRole("navigation", {name:"Activity Log filters"});
    const people = nav.getByRole("link", {name:"People & access"});
    const url = new URL(await people.getAttribute("href") ?? "", "http://localhost:3000");
    expect(url.searchParams.get("q")).toBe("offer");
    expect(url.searchParams.get("actorName")).toBe("Asha");
    expect(url.searchParams.get("eventType")).toBe("placements.offer.issued");
    expect(url.searchParams.get("view")).toBe("people");
    expect(url.searchParams.get("range")).toBe("ALL");
    expect(url.searchParams.has("beforeId")).toBe(false);

    const weekHref = await nav.getByRole("link", {name:"7 days"}).getAttribute("href");
    const week = new URL(weekHref ?? "", "http://localhost:3000").searchParams;
    expect(week.get("q")).toBe("offer");
    expect(week.get("range")).toBe("7d");
    const from = week.get("from")!;
    const to = week.get("to")!;
    expect((Date.parse(to+"T00:00:00Z") - Date.parse(from+"T00:00:00Z"))/86400000).toBe(6);

    const monthHref = await nav.getByRole("link", {name:"30 days"}).getAttribute("href");
    const month = new URL(monthHref ?? "", "http://localhost:3000").searchParams;
    expect((Date.parse(month.get("to")+"T00:00:00Z") - Date.parse(month.get("from")+"T00:00:00Z"))/86400000).toBe(29);
    await page.screenshot({path:"test-results/ux-g004-desktop.png",fullPage:true});
  });

  test("320px forensic view is readable, keyboard navigable, and can open details", async ({page,context}) => {
    await authenticateGracefulRole(context,"superadmin");
    await page.setViewportSize({width:320,height:780});
    await page.goto("/activity?mode=raw&view=all&range=ALL");
    await expect(page.getByRole("heading",{level:1,name:"Activity Log"})).toBeVisible();
    await expect(page.getByRole("heading",{name:"Raw Audit Logs",exact:true})).toBeVisible();
    await expect(page.locator("table").filter({hasText:"User Agent"})).toBeHidden();
    const mobileItems = page.locator('ol[aria-label="Audit log events"] > li');
    if (await mobileItems.count()) {
      const first = mobileItems.first();
      const detail = first.getByRole("link",{name:"View event details"});
      await detail.focus();
      await expect(detail).toBeFocused();
      await detail.click();
      await expect(page.getByRole("heading",{name:"Event context"})).toBeVisible();
      const panel = page.getByRole("region",{name:"Event context JSON, scrollable"});
      if (await panel.count()) {
        await panel.focus();
        await expect(panel).toBeFocused();
      }
    } else {
      await expect(page.getByText("No audit logs match these filters.").first()).toBeVisible();
      await expect(page.getByRole("link",{name:"Clear filters"})).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.screenshot({path:"test-results/ux-g004-mobile-320.png",fullPage:true});
  });

  test("390px activity feed offers accessible recovery, while learners cannot access admin activity", async ({page,context}) => {
    await authenticateGracefulRole(context,"superadmin");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/activity?view=all&range=ALL");
    await expect(page.getByRole("heading",{level:1,name:"Activity Log"})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Activity Log filters"})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.screenshot({path:"test-results/ux-g004-mobile-390.png",fullPage:true});

    await authenticateGracefulRole(context,"learner");
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/);
    await expect(page.getByRole("heading",{level:1,name:"Activity Log"})).toHaveCount(0);
  });
});
