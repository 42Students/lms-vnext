import { expect, test, type BrowserContext } from "@playwright/test";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const e2eSecret = process.env.E2E_AUTH_SECRET;
test.skip(!e2eSecret, "Authenticated Faculty E2E needs E2E_AUTH_SECRET");

async function facultyLogin(context: BrowserContext) {
  await context.addCookies([
    { name: E2E_IDENTITY_COOKIE_NAME, value: "seed-shared-faculty", url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" },
    { name: E2E_SECRET_COOKIE_NAME, value: e2eSecret!, url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" },
    { name: "lms_membership", value: SEED_IDS.facultyCollegeAMembership, url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" },
  ]);
}

test("Faculty has five distinct, authorized Course tabs and editable Section Blueprint", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await expect(page.getByRole("heading", { level: 1, name: "Courses" })).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Search courses" });
  await search.fill("no-matching-course-zzzz");
  await expect(page.getByText("No courses match your search")).toBeVisible();
  await search.fill("E2E Browser Course");
  const courseCard = page.getByRole("link", { name: /E2E Browser Course/ });
  await expect(courseCard).toContainText("E2E Section A");
  await courseCard.click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[^/]+\/home$/);
  const tabs = page.getByRole("navigation", { name: "Faculty course tabs" });
  for (const label of ["Overview", "Blueprint", "Students", "Attendance", "Discussions"]) {
    await expect(tabs.getByRole("link", { name: label })).toBeVisible();
  }
  await tabs.getByRole("link", { name: "Blueprint" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[^/]+\/blueprint$/);
  const sectionContent = page.getByRole("article").filter({ hasText: "E2E Section A Notes" });
  await expect(sectionContent).toBeVisible();
  await expect(page.getByText("E2E Section B Secret", { exact: true })).toHaveCount(0);
  await sectionContent.getByRole("button", { name: "Edit content" }).click();
  await expect(page.getByRole("dialog", { name: "Edit RESOURCE" })).toBeVisible();
  await page.getByRole("button", { name: "Close drawer" }).click();

  await tabs.getByRole("link", { name: "Students" }).click();
  await expect(page).toHaveURL(/\/students$/);
  await expect(page.getByRole("heading", { level: 1, name: "Students" })).toBeVisible();
  await tabs.getByRole("link", { name: "Attendance" }).click();
  await expect(page).toHaveURL(/\/attendanceDetail$/);
  await tabs.getByRole("link", { name: "Discussions" }).click();
  await expect(page).toHaveURL(/\/discussions$/);
  await expect(page.getByLabel("Write a message")).toBeVisible();
  await tabs.getByRole("link", { name: "Overview" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("Faculty can start Course-bound Assignment and Quiz drafts on aggregate pages", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/allAssignments");
  await page.getByRole("button", { name: "+ Create Assignment" }).click();
  const assignments = page.getByRole("dialog", { name: "Create Assignment" });
  await expect(assignments.getByLabel("Choose assessment lesson")).toBeVisible();
  await expect(assignments.getByRole("button", { name: "Create draft" })).toBeVisible();
  await assignments.getByRole("button", { name: "Close drawer" }).click();

  await page.goto("/teacher/allQuizzes");
  await page.getByRole("button", { name: "+ Create Quiz" }).click();
  const quizzes = page.getByRole("dialog", { name: "Create Quiz" });
  await expect(quizzes.getByLabel("Choose assessment lesson")).toBeVisible();
  await expect(quizzes.getByRole("button", { name: "Create draft" })).toBeVisible();
});

test("Faculty mobile tabs remain navigable without a desktop-only action", async ({ page, context }) => {
  await facultyLogin(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  const tabs = page.getByRole("navigation", { name: "Faculty course tabs" });
  for (const label of ["Overview", "Blueprint", "Students", "Attendance", "Discussions"]) {
    await expect(tabs.getByRole("link", { name: label })).toBeVisible();
  }
  await tabs.getByRole("link", { name: "Blueprint" }).click();
  await expect(page).toHaveURL(/\/blueprint$/);
});
