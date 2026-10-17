import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

async function openReply(page: Page): Promise<void> {
  await page.goto("/hr/conversations");
  // A fresh recruiter seed may not have opened its first general thread yet.
  const open = page.getByRole("button", { name: "Open general conversation" });
  if (await open.isVisible()) {
    await open.click();
    await page.waitForLoadState("domcontentloaded");
  }
  const thread = page.getByText("Message the placement cell · General");
  if (await thread.isVisible()) {
    await thread.click();
  }
  await expect(page.getByRole("button", { name: "Send reply" }).first()).toBeVisible();
}

test.describe("GR-80 Recruiter messaging preserves unsent replies", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires seed-test-tenants Recruiter with a current verified company grant");
  test.describe.configure({ mode: "serial" });

  for (const kind of [
    "backend-down", "html-502", "json-500", "forbidden",
    "conflict", "rate-limit", "slow", "session-expired",
  ] as FailureKind[]) {
    test(`GR-80 Recruiter failed conversation reply ${kind} keeps draft`, async ({ page, context }) => {
      test.setTimeout(40_000);
      await authenticateGracefulRole(context, "recruiter");
      await openReply(page);
      const errors = captureUncaughtErrors(page);
      const form = page.locator("form").filter({
        has: page.getByRole("button", { name: "Send reply" }),
      }).first();
      const body = form.getByRole("textbox", { name: "Message" });
      await body.fill("Recruiter browser draft must not disappear");
      const failure = await failApi(
        page, kind === "backend-down" ? "**/api/**" : /\/api\/placements\/recruiter\/conversations\/[^/]+\/reply$/, kind,
      );
      try {
        await form.getByRole("button", { name: "Send reply" }).click();
        await expect.poll(failure.hits).toBeGreaterThan(0);
        await expect(form.getByRole("status")).toContainText(
          /could not send|retry|check the thread|server/i, { timeout: 15_000 },
        );
        await expect(body).toHaveValue("Recruiter browser draft must not disappear");
        await expect(form.getByRole("button", { name: "Send reply" })).toBeEnabled();
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 Recruiter offline reply keeps typed message", async ({ page, context }) => {
    await authenticateGracefulRole(context, "recruiter");
    await openReply(page);
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send reply" }) }).first();
    const body = form.getByRole("textbox", { name: "Message" });
    await body.fill("Send when online, not twice");
    await context.setOffline(true);
    try {
      await form.getByRole("button", { name: "Send reply" }).click();
      await expect(form.getByRole("status")).toContainText(/could not send|server|retry|connection/i);
      await expect(body).toHaveValue("Send when online, not twice");
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });
});

test("GR-80 GR-34 Recruiter slow message reply never submits twice", async ({ page, context }) => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Needs seeded Recruiter and an active college conversation");
  test.setTimeout(40_000);
  await authenticateGracefulRole(context, "recruiter");
  await openReply(page);
  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "Send reply" }),
  }).first();
  const message = form.getByRole("textbox", { name: "Message" });
  await message.fill("Unsent employer message must be delivered at most once");
  const fault = await failApi(page, /\\/api\\/placements\\/recruiter\\/conversations\\/[^/]+\\/reply$/, "slow");
  try {
    await form.getByRole("button", { name: "Send reply" }).click();
    await expect.poll(() => fault.requests().filter(request =>
      /^POST \\/api\\/placements\\/recruiter\\/conversations\\/[^/]+\\/reply$/.test(request)).length)
      .toBe(1);
    await expect(form.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await message.press("ControlOrMeta+Enter");
    expect(fault.hits()).toBe(1);
    await expect(form.getByRole("button", { name: "Send reply" }))
      .toBeEnabled({ timeout: 15_000 });
    await expect(message).toHaveValue("Unsent employer message must be delivered at most once");
    expect(fault.hits()).toBe(1);
    await expectNoRawErrors(page);
  } finally {
    await fault.dispose();
  }
});
