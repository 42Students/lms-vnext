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

test("Faculty Blueprint persists an authorized Section Resource edit after a full reload", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  const blueprint = page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Blueprint" });
  await blueprint.click();
  const article = page.getByRole("article").filter({ hasText: "E2E Section A Notes" });
  await article.getByRole("button", { name: "Edit content" }).click();
  const drawer = page.getByRole("dialog", { name: "Edit RESOURCE" });
  const original = await drawer.getByLabel("Notes").inputValue();
  const marker = "Faculty persisted-resource browser check";

  async function patchNotes(notes: string) {
    const edit = page.getByRole("dialog", { name: "Edit RESOURCE" });
    await edit.getByLabel("Notes").fill(notes);
    const response = page.waitForResponse((res) =>
      res.request().method() === "PATCH" &&
      /\/api\/courses\/lesson-contents\/[^/]+$/.test(new URL(res.url()).pathname));
    await edit.getByRole("button", { name: "Save content" }).click();
    expect((await response).ok()).toBe(true);
  }

  try {
    await patchNotes(marker);
    await page.reload();
    await expect(page.getByRole("article").filter({ hasText: "E2E Section A Notes" }))
      .toContainText(marker);
    await expect(page.getByText("E2E Section B Secret", { exact: true })).toHaveCount(0);
  } finally {
    if (!page.isClosed()) {
      await page.goto("/teacher/courses");
      await page.getByRole("link", { name: /E2E Browser Course/ }).click();
      await page.getByRole("navigation", { name: "Faculty course tabs" })
        .getByRole("link", { name: "Blueprint" }).click();
      await page.getByRole("article").filter({ hasText: "E2E Section A Notes" })
        .getByRole("button", { name: "Edit content" }).click();
      await patchNotes(original);
    }
  }
});

test("Faculty Attendance is scoped to its Course and exposes learner detail affordances", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Attendance" }).click();
  await expect(page.getByRole("heading", { name: "Attendance" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Attendance report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark attendance" })).toBeVisible();
  // If the seed contains a session in the visible month, the learner button
  // must reveal real per-session data, not make up a Present attendance mark.
  const details = page.getByRole("button", { name: /^View attendance details for / });
  if (await details.count()) {
    await details.first().click();
    const panel = page.getByRole("dialog", { name: /attendance$/ });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Session history")).toBeVisible();
    await expect(panel.getByText("Not marked", { exact: true })).toBeVisible();
    await panel.getByRole("button", { name: "Close drawer" }).click();
  }
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

test("Faculty Contacts matches the legacy tabs, college search and page size", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/contacts/allContacts");
  await expect(page.getByRole("heading", { level: 1, name: "Contacts" })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Contact types" });
  for (const label of ["All Contacts", "Teachers", "Students"]) {
    await expect(tabs.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(page.getByRole("columnheader", { name: "Role" })).toBeVisible();
  await page.getByLabel("Search contacts").fill("learner.seed@example.com");
  await page.getByLabel("Contacts per page").selectOption("50");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=learner.seed%40example.com/);
  await expect(page).toHaveURL(/pageSize=50/);
  await expect(page.getByRole("table").getByText("learner.seed@example.com")).toBeVisible();
  await expect(page.getByRole("table").getByText("Student")).toBeVisible();
  await tabs.getByRole("link", { name: "Teachers" }).click();
  await expect(page.getByRole("columnheader", { name: "Role" })).toHaveCount(0);
  await expect(page.getByRole("table").getByText("learner.seed@example.com")).toHaveCount(0);
  await tabs.getByRole("link", { name: "Students" }).click();
  await expect(page.getByRole("table").getByText("learner.seed@example.com")).toBeVisible();
});

test("Faculty Contacts renders accessible mobile cards", async ({ page, context }) => {
  await facultyLogin(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/teacher/contacts/students?q=learner.seed%40example.com&pageSize=10");
  await expect(page.getByRole("heading", { level: 1, name: "Contacts" })).toBeVisible();
  await expect(page.locator("article").filter({ hasText:"learner.seed@example.com" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Students" })).toHaveAttribute("aria-current","page");
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
