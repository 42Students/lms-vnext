import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

test.describe("UX-G002 root sign-in and workspace recovery", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires an isolated seeded authenticated E2E database");

  test("1280px platform root redirects to public home, legacy Super Admin stays at OTP", async ({page}) => {
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/");
    await expect(page).toHaveURL(/\/home(?:[?#]|$)/);
    expect(await noHorizontalOverflow(page)).toBe(true);
    await page.goto("/?legacy=superadmin");
    await expect(page).toHaveURL(/\/\?legacy=superadmin$/);
    await expect(page.locator('main[data-legacy-superadmin="true"]')).toBeVisible();
    await expect(page.locator("#sign-in-content")).toBeVisible();
    await expect(page.getByRole("link",{name:"Skip to sign in"})).toHaveAttribute("href","#sign-in-content");
    await page.screenshot({path:"test-results/ux-g002-root-desktop-1280.png",fullPage:true});
  });

  test("390px expired sign-in preserves safe destination and rejects offsite redirect", async ({page}) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto("/?auth=expired&returnTo=%2Flearn%2Fcourses");
    await expect(page.locator("#sign-in-content [role=\"alert\"]").first()).toContainText("Your session expired");
    const restart=page.getByRole("link",{name:"Start a fresh sign-in"});
    await expect(restart).toHaveAttribute("href",/returnTo=%2Flearn%2Fcourses/);
    await restart.focus();
    await expect(restart).toBeFocused();
    expect(await noHorizontalOverflow(page)).toBe(true);
    await page.screenshot({path:"test-results/ux-g002-root-mobile-390.png",fullPage:true});

    await page.goto("/?auth=invalid&returnTo=%2F%2Fevil.example");
    await expect(page.getByRole("link",{name:"Start a fresh sign-in"})).toHaveAttribute("href","/login");
    await expect(page.locator("#sign-in-content [role=\"alert\"]").first()).not.toContainText("evil.example");
  });
});

test.describe("UX-G079 quiz entry and recovery", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires a seeded learner session");

  for (const layout of [
    {name:"phone-320",width:320,height:780},
    {name:"desktop-1280",width:1280,height:800},
  ]) {
    test(`${layout.name} missing quiz ID shows safe recovery with no submission`, async ({page,context}) => {
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize({width:layout.width,height:layout.height});
      await page.goto("/quiz");
      const cancel=page.getByRole("link",{name:"Cancel quiz and return to All Quizzes"});
      await expect(cancel).toBeVisible();
      await expect(cancel).toHaveAttribute("href","/learn/allQuizzes");
      await cancel.focus();
      await expect(cancel).toBeFocused();
      await expect(page.getByRole("heading",{name:"Something went wrong"})).toBeVisible();
      await expect(page.getByText("Cannot submit: Quiz not loaded.",{exact:false})).toBeVisible();
      await expect(page.getByRole("button",{name:"Try Again"})).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.screenshot({path:`test-results/ux-g079-quiz-${layout.name}.png`,fullPage:true});
    });
  }
});
