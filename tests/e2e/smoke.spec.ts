import { expect, test } from "@playwright/test";

test("foundation page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LMS vNext" })).toBeVisible();
});

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.service).toBe("lms-vnext");
});
