import { expect, test, type BrowserContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const e2eSecret = process.env.E2E_AUTH_SECRET;
test.skip(!e2eSecret, "Authenticated Faculty E2E needs E2E_AUTH_SECRET");

async function facultyLogin(context: BrowserContext) {
  await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
    { name: E2E_IDENTITY_COOKIE_NAME, value: "seed-shared-faculty", url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" },
    { name: E2E_SECRET_COOKIE_NAME, value: e2eSecret!, url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" },
    { name: "lms_membership", value: SEED_IDS.facultyCollegeAMembership, url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" },
  ]);
}

// File Explorer was a legacy redirect, not an additional file manager.
for (const view of [{ name: "desktop", width: 1280, height: 800 },
                    { name: "mobile", width: 390, height: 844 }]) {
  test("Faculty legacy File Explorer bookmark resolves to Courses on " + view.name,
    async ({ page, context }) => {
      await facultyLogin(context);
      await page.setViewportSize({ width: view.width, height: view.height });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/teacher/fileExplorer");
      await expect.poll(() => new URL(page.url()).pathname).toBe("/teacher/courses");
      await expect(page.getByRole("heading", { level: 1, name: "Courses" })).toBeVisible();
      if (view.name === "mobile") {
        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(width).toBeLessThanOrEqual(view.width + 1);
      }
      expect(errors).toEqual([]);
    });
}

test("Faculty has five distinct, authorized Course tabs and editable Section Blueprint", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await expect(page.getByRole("heading", { level: 1, name: "Courses" })).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Search courses" });
  await search.fill("no-matching-course-zzzz");
  await expect(page.getByText("No courses match your search")).toBeVisible();
  await search.fill("E2E Browser Course");
  const courseRow = page.getByRole("region", { name: "Courses in the new Faculty prototype" })
    .getByRole("row").filter({ hasText: "E2E Browser Course" }).first();
  await expect(courseRow).toContainText("E2E Section A");
  await courseRow.getByRole("link", { name: "Open", exact: true }).click();
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

test("Faculty empty discussion offers legacy starter drafts without posting them", async ({ page, context }) => {
  await facultyLogin(context);
  await page.route(url=>url.pathname.startsWith("/api/courses/deliveries/") && url.pathname.endsWith("/discussions"), async route=>{
    if(route.request().method()!=="GET")return route.continue();
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
      messages:[],highlightedPinned:null,nextCursor:null,canPost:true,
    })});
  });
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  await page.getByRole("navigation",{name:"Faculty course tabs"})
    .getByRole("link",{name:"Discussions"}).click();
  await expect(page.getByText("Start the conversation")).toBeVisible();
  await page.getByRole("button",{name:"Post a welcome message"}).click();
  await expect(page.getByLabel("Write a message")).toHaveValue(
    "Welcome! Use this space for questions about the course.",
  );
  await page.getByRole("button",{name:"Share this week's focus"}).click();
  await expect(page.getByLabel("Write a message")).toHaveValue(
    "This week we are focusing on: ",
  );
});

test("Faculty posts, pins, unpins and deletes a Section discussion in the browser", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Discussions" }).click();
  const text = "Faculty moderation browser proof " + Date.now();
  await page.getByLabel("Write a message").fill(text);
  const create = page.waitForResponse(res =>
    res.request().method() === "POST" && new URL(res.url()).pathname.endsWith("/discussions"));
  await page.getByRole("button", { name: "Post", exact: true }).click();
  const posted = await create;
  expect(posted.status()).toBe(201);
  const messageId = (await posted.json()).message.id;
  const article = page.getByRole("article").filter({ hasText: text });
  await expect(article).toBeVisible();
  const actionPath = "/api/courses/deliveries/";
  page.once("dialog", dialog => dialog.accept());
  const pin = page.waitForResponse(res =>
    res.request().method() === "PATCH" &&
    new URL(res.url()).pathname.includes(actionPath) &&
    new URL(res.url()).pathname.endsWith("/" + messageId));
  await article.getByRole("button", { name: "Pin", exact: true }).click();
  expect((await pin).ok()).toBe(true);
  await expect(article.getByRole("button", { name: "Unpin" })).toBeVisible();
  const pinnedStripUnpin=page.getByRole("button",{name:"Unpin pinned message"});
  await expect(pinnedStripUnpin).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  const unpin = page.waitForResponse(res =>
    res.request().method() === "PATCH" && new URL(res.url()).pathname.endsWith("/" + messageId));
  await pinnedStripUnpin.click();
  expect((await unpin).ok()).toBe(true);
  page.once("dialog", dialog => dialog.accept());
  const removed = page.waitForResponse(res =>
    res.request().method() === "DELETE" && new URL(res.url()).pathname.endsWith("/" + messageId));
  await article.getByRole("button", { name: "Delete", exact: true }).click();
  expect((await removed).ok()).toBe(true);
  await expect(article).toHaveCount(0);
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

test("Faculty Students links an authorized roster member to mobile-readable attendance history", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Students" }).click();
  const detailLink = page.getByRole("link", { name: "View student details" }).first();
  await expect(detailLink).toBeVisible();
  const href = await detailLink.getAttribute("href");
  expect(href).toMatch(/\/teacher\/courses\/[^/]+\/students\/[0-9a-f-]{36}$/i);
  await detailLink.click();
  await expect(page).toHaveURL(/\/students\/[0-9a-f-]{36}$/i);
  await expect(page.getByRole("heading", { name: "Course attendance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Session history" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Session history" })).toBeVisible();
  // When persisted sessions exist, the mobile-friendly history replaces the wide table.
  const mobileHistory = page.getByRole("list", { name: "Mobile session history" });
  if (await mobileHistory.count()) {
    await expect(mobileHistory).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
  }
});

test("Faculty Attendance student detail shows a real future session without fabricating presence", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Attendance" }).click();
  await expect(page.getByRole("heading", { name: "Attendance", exact: true, level: 1 })).toBeVisible();
  const deliveryId = new URL(page.url()).pathname.split("/").at(-2);
  expect(deliveryId).toBeTruthy();

  // This test owns a real, authorized class session in the disposable browser DB.
  // Reusing an arbitrary seeded month could quietly skip the student-detail path.
  // Keep the fixture outside held-class tests and distinguish retries;
  // PostgreSQL prohibits concurrent overlapping classes for one Section.
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000 + testInfo.retry * 2 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const startParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  }).formatToParts(start);
  const month = startParts.find((part) => part.type === "year")!.value + "-" +
    startParts.find((part) => part.type === "month")!.value;
  const sessionTitle = "Faculty attendance detail browser proof";
  await page.getByRole("button", { name: "Schedule Class" }).click();
  const form = page.getByRole("dialog", { name: "Schedule Class" });
  await expect(form).toBeVisible();
  await form.getByLabel("Class title").fill(sessionTitle);
  await form.getByLabel("Starts at").fill(start.toISOString().slice(0, 16));
  await form.getByLabel("Ends at").fill(end.toISOString().slice(0, 16));
  const response = page.waitForResponse((res) =>
    res.request().method() === "POST" &&
    new URL(res.url()).pathname === "/api/attendance/faculty");
  await form.getByRole("button", { name: "Schedule Class" }).click();
  const scheduleResult = await response;
  expect(scheduleResult.status(), await scheduleResult.text()).toBe(201);

  await page.goto("/teacher/courses/" + deliveryId + "/attendanceDetail");
  await expect(page.getByRole("heading", { name: "Attendance", exact: true, level: 1 })).toBeVisible();
  await page.locator('input[type="month"]').fill(month);
  const health = page.getByRole("region", { name: "Monthly class health" });
  await expect(health).toBeVisible();
  await expect(health).toContainText("Upcoming");
  await expect(health).toContainText("Unmarked and upcoming sessions are excluded");
  await expect(page.getByRole("region", { name: "Attendance threshold guidance" }))
    .toContainText("without recorded attendance");
  await expect(health.getByRole("button", { name: "Download PDF" })).toBeVisible();
  await expect(page.getByText("Attendance report")).toBeVisible();
  const learner = page.getByRole("button", { name: /^View attendance details for / });
  await expect(learner.first()).toBeVisible();
  await learner.first().click();
  const detail = page.getByRole("dialog", { name: / attendance$/ });
  await expect(detail).toBeVisible();
  await expect(detail.getByText(sessionTitle, { exact: true })).toBeVisible();
  await expect(detail.getByText("Upcoming", { exact: true })).toBeVisible();
  await expect(detail.getByText("Scheduled", { exact: true })).toBeVisible();
  await detail.getByRole("button", { name: "Close drawer" }).click();

  // The other Drawer must retain its own accessible title.
  await page.getByRole("button", { name: "Schedule Class" }).click();
  await expect(page.getByRole("dialog", { name: "Schedule Class" })).toBeVisible();
});

test("Faculty marks and corrects a persisted session from its Calendar class link", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  const courseAttendance = page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Attendance" });
  const destination = await courseAttendance.getAttribute("href");
  expect(destination).toMatch(/\/teacher\/courses\/[^/]+\/attendanceDetail$/);
  await courseAttendance.click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[^/]+\/attendanceDetail$/);
  const deliveryId = new URL(page.url()).pathname.split("/").at(-2)!;
  expect(deliveryId).toBeTruthy();

  // Held class inside the correction window in disposable E2E PostgreSQL.
  // Use a distinct recently-held slot per retry; all stay in the
  // Faculty correction window and never overlap the next-day case.
  const started = new Date(Date.now() - (4 - testInfo.retry) * 8 * 60_000);
  const ended = new Date(started.getTime() + 4 * 60_000);
  const localTime = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString().slice(0, 16);
  const title = "Faculty marking browser proof";
  await page.getByRole("button", { name: "Schedule Class" }).click();
  const form = page.getByRole("dialog", { name: "Schedule Class" });
  await form.getByLabel("Class title").fill(title);
  await form.getByLabel("Starts at").fill(localTime(started));
  await form.getByLabel("Ends at").fill(localTime(ended));
  const scheduled = page.waitForResponse((res) =>
    res.request().method() === "POST" &&
    new URL(res.url()).pathname === "/api/attendance/faculty");
  await form.getByRole("button", { name: "Schedule Class" }).click();
  const scheduleResponse = await scheduled;
  expect(scheduleResponse.status(), await scheduleResponse.text()).toBe(201);
  const sessionId: string = (await scheduleResponse.json()).session.id;
  expect(sessionId).toBeTruthy();

  // A second class cannot overlap this exact Section; show an actionable
  // validation message instead of the previous generic 500.
  await page.getByRole("button", { name: "Schedule Class" }).click();
  const conflicting = page.getByRole("dialog", { name: "Schedule Class" });
  await conflicting.getByLabel("Class title").fill("Overlapping class should fail");
  await conflicting.getByLabel("Starts at").fill(localTime(started));
  await conflicting.getByLabel("Ends at").fill(localTime(ended));
  const collisionResponse = page.waitForResponse((res) =>
    res.request().method() === "POST" &&
    new URL(res.url()).pathname === "/api/attendance/faculty");
  await conflicting.getByRole("button", { name: "Schedule Class" }).click();
  const overlap = await collisionResponse;
  expect(overlap.status(), await overlap.text()).toBe(409);
  await expect(conflicting.getByRole("alert").filter({ hasText: "Another class overlaps this time in the Section" }).first()).toBeVisible();
  await conflicting.getByRole("button", { name: "Close drawer" }).click();

  await page.goto("/teacher/calendar");
  await expect(page.getByRole("heading", { name: "Class Schedule", level: 1 })).toBeVisible();
  await page.getByRole("combobox", { name: "View", exact: true }).selectOption("day");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  const exactLink = page.locator(
    'a[href="/teacher/courses/' + deliveryId + '/attendanceDetail?sessionId=' + sessionId + '"]',
  ).first();
  await expect(exactLink).toBeVisible();
  await expect(exactLink).toHaveText("Open class attendance");
  await exactLink.click();
  await expect(page).toHaveURL(new RegExp("/attendanceDetail\\?sessionId=" + sessionId + "$"));

  await expect(page.getByRole("button", { name: "Mark attendance", exact: true })).toBeVisible();
  await expect(page.getByLabel("Class session", { exact: true })).toHaveValue(sessionId);
  const absentButton = page.locator('[aria-label="Attendance roster"]').getByRole("button", { name: /^Mark .+ absent$/ }).first();
  await expect(absentButton).toBeEnabled();
  await absentButton.click();
  const firstMark = page.waitForResponse((res) =>
    res.request().method() === "PATCH" &&
    new URL(res.url()).pathname === "/api/attendance/faculty/sessions/" + sessionId);
  await page.getByRole("button", { name: "Submit Attendance" }).click();
  expect((await firstMark).ok()).toBe(true);
  await page.reload();
  await expect(page.locator('[aria-label="Attendance roster"]').getByRole("button", { name: /^Mark .+ absent$/ }).first())
    .toHaveAttribute("aria-pressed", "true");

  const presentButton = page.locator('[aria-label="Attendance roster"]').getByRole("button", { name: /^Mark .+ present$/ }).first();
  await presentButton.click();
  const correction = page.waitForResponse((res) =>
    res.request().method() === "PATCH" &&
    new URL(res.url()).pathname === "/api/attendance/faculty/sessions/" + sessionId);
  await page.getByRole("button", { name: "Submit Attendance" }).click();
  expect((await correction).ok()).toBe(true);
  await page.reload();
  await expect(page.locator('[aria-label="Attendance roster"]').getByRole("button", { name: /^Mark .+ present$/ }).first())
    .toHaveAttribute("aria-pressed", "true");
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

test("Faculty Assignment aggregate creates, filters, edits and archives an actual Section draft", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  await facultyLogin(context);
  await page.goto("/teacher/allAssignments");
  await page.getByRole("button", { name: "+ Create Assignment" }).click();
  const create = page.getByRole("dialog", { name: "Create Assignment" });
  await expect(create.getByLabel("Choose assessment lesson")).toBeVisible();
  const first = "Faculty draft browser acceptance " + testInfo.retry;
  const renamed = "Faculty updated browser acceptance " + testInfo.retry;
  await create.getByLabel("Title", { exact: true }).fill(first);
  const createdResponse = page.waitForResponse((res) =>
    res.request().method() === "POST" &&
    new URL(res.url()).pathname === "/api/courses/assignments");
  await create.getByRole("button", { name: "Create draft" }).click();
  const created = await createdResponse;
  expect(created.status()).toBe(201);
  const assignmentId: string = (await created.json()).assignment.id;
  expect(assignmentId).toBeTruthy();
  await page.reload();

  const search = page.getByLabel("Search assessments");
  await search.fill("no matching faculty assessment x-y-z");
  await expect(page.getByText("No matching assessments")).toBeVisible();
  await search.fill(first);
  const row = page.getByRole("article").filter({ hasText: first });
  await expect(row).toBeVisible();
  await expect(row).toContainText("DRAFT");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Edit Assignment" });
  await dialog.getByLabel("Title", { exact: true }).fill("Unsaved cancellation");
  await dialog.getByRole("button", { name: "Close drawer" }).click();
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit Assignment" });
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(first);

  await dialog.getByLabel("Title", { exact: true }).fill(renamed);
  const editedResponse = page.waitForResponse((res) =>
    res.request().method() === "PATCH" &&
    new URL(res.url()).pathname === "/api/courses/assignments/" + assignmentId);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  expect((await editedResponse).ok()).toBe(true);
  await page.reload();
  await page.getByLabel("Search assessments").fill(renamed);
  const updatedRow = page.getByRole("article").filter({ hasText: renamed });
  await expect(updatedRow).toBeVisible();
  await updatedRow.getByRole("button", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit Assignment" });
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(renamed);

  page.once("dialog", (confirm) => confirm.accept());
  const archiveResponse = page.waitForResponse((res) =>
    res.request().method() === "POST" &&
    new URL(res.url()).pathname === "/api/courses/assignments/" + assignmentId + "/transition");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  const archive = await archiveResponse;
  expect(archive.ok()).toBe(true);
  expect((await archive.json()).assignment.status).toBe("ARCHIVED");
});

test("Faculty Quiz aggregate persists questions, metadata edits and archival", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  await facultyLogin(context);
  await page.goto("/teacher/allQuizzes");
  await page.getByRole("button", { name: "+ Create Quiz" }).click();
  const create = page.getByRole("dialog", { name: "Create Quiz" });
  await expect(create.getByLabel("Choose assessment lesson")).toBeVisible();
  const title = "Faculty quiz browser acceptance " + testInfo.retry;
  const updated = "Faculty quiz amended acceptance " + testInfo.retry;
  await create.getByLabel("Title", { exact: true }).fill(title);
  await create.getByLabel("Prompt", { exact: true }).fill("What is one plus one?");
  await create.getByLabel("Option 1", { exact: true }).fill("Two");
  await create.getByLabel("Option 2", { exact: true }).fill("Three");
  const creation = page.waitForResponse((response) =>
    response.request().method() === "POST" &&
    new URL(response.url()).pathname === "/api/courses/quizzes");
  await create.getByRole("button", { name: "Create draft" }).click();
  const response = await creation;
  const payload = await response.json();
  expect(response.status(), JSON.stringify(payload)).toBe(201);
  const quizId: string = payload.quiz.id;
  expect(quizId).toBeTruthy();
  await page.goto("/teacher/allQuizzes");

  const search = page.getByLabel("Search assessments");
  await search.fill("no-such-quiz-value");
  await expect(page.getByText("No matching assessments")).toBeVisible();
  await search.fill(title);
  const row = page.getByRole("article").filter({ hasText: title });
  await expect(row).toContainText("DRAFT");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit Quiz" });
  await expect(editor.getByLabel("Title", { exact: true })).toHaveValue(title);
  await editor.getByLabel("Title", { exact: true }).fill(updated);
  await editor.getByLabel("Maximum attempts").fill("3");
  const editResponse = page.waitForResponse((res) =>
    res.request().method() === "PATCH" &&
    new URL(res.url()).pathname === "/api/courses/quizzes/" + quizId);
  await editor.getByRole("button", { name: "Save changes" }).click();
  const edit = await editResponse;
  expect(edit.status(), await edit.text()).toBe(200);

  await page.goto("/teacher/allQuizzes");
  await page.getByLabel("Search assessments").fill(updated);
  const amended = page.getByRole("article").filter({ hasText: updated });
  await expect(amended).toBeVisible();
  await expect(amended).toContainText("3 allowed attempts");
  await amended.getByRole("button", { name: "Edit", exact: true }).click();
  const editAgain = page.getByRole("dialog", { name: "Edit Quiz" });
  await expect(editAgain.getByLabel("Title", { exact: true })).toHaveValue(updated);
  await expect(editAgain.getByLabel("Maximum attempts")).toHaveValue("3");
  page.once("dialog", (confirm) => confirm.accept());
  const archiving = page.waitForResponse((res) =>
    res.request().method() === "POST" &&
    new URL(res.url()).pathname === "/api/courses/quizzes/" + quizId + "/transition");
  await editAgain.getByRole("button", { name: "Delete", exact: true }).click();
  const archivedResponse = await archiving;
  const archived = await archivedResponse.json();
  expect(archivedResponse.status(), JSON.stringify(archived)).toBe(200);
  expect(archived.quiz.status).toBe("ARCHIVED");
});

test("Faculty Assessment results filter only assigned teaching Sections and preserve deep links", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/results");
  await expect(page.getByRole("heading", { name: "Assessment results", level: 1 })).toBeVisible();
  const section = page.getByRole("combobox", { name: "Teaching Section" });
  await expect(section.locator("option").first()).toHaveText("All teaching sections");
  const choices = section.locator("option");
  expect(await choices.count()).toBeGreaterThan(1);
  const allowedId = await choices.nth(1).getAttribute("value");
  expect(allowedId).toMatch(/^[0-9a-f-]{36}$/i);
  await section.selectOption(allowedId!);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page).toHaveURL(new RegExp("deliveryId=" + allowedId));
  await expect(page.getByRole("combobox", { name: "Teaching Section" })).toHaveValue(allowedId!);
  const reports = page.getByRole("link", { name: "Open Section report" });
  for (const href of await reports.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toContain("deliveryId=" + allowedId);
  }
  await page.goto("/teacher/results?deliveryId=not-a-uuid");
  await expect(page.getByRole("alert").filter({ hasText: "Invalid assessment filters" })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/teacher\/results$/);
});

test("Faculty Notifications keep the Faculty route through unread and cursor recovery", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/notifications");
  await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personal notifications" })).toBeVisible();
  const filters = page.getByRole("group", { name: "Notification filter" });
  await filters.getByRole("link", { name: /Unread/ }).click();
  await expect(page).toHaveURL(/\/teacher\/notifications\?view=unread$/);
  await expect(page.getByRole("button", { name: "Mark all as read" })).toBeVisible();
  await filters.getByRole("link", { name: "All", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/notifications\?view=all$/);

  await page.goto("/teacher/notifications?view=unread&beforeCreatedAt=invalid&beforeId=bad-id");
  const invalid = page.getByRole("alert").filter({ hasText: "notification page link is invalid" });
  await expect(invalid).toBeVisible();
  await invalid.getByRole("link", { name: "Return to the newest notifications" }).click();
  await expect(page).toHaveURL(/\/teacher\/notifications\?view=unread$/);
});

test("Faculty Contacts verifies public-only role cards, scoped search and page size", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/contacts/allContacts");
  await expect(page.getByRole("heading", { level: 1, name: "Contacts" })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Contact types" });
  for (const label of ["All Contacts", "Teachers", "Students"]) {
    await expect(tabs.getByRole("link", { name: label })).toBeVisible();
  }
  const publicLearner = page.locator("article").filter({
    has: page.locator('a[href$="/' + SEED_IDS.learnerCollegeAMembership + '"]'),
  });
  await expect(publicLearner).toBeVisible();
  await expect(publicLearner.getByRole("list", { name: "Current college roles" })).toContainText("Student");
  await expect(page.getByRole("table")).toHaveCount(0);
  // The public directory deliberately does not search or disclose login email.
  await page.getByLabel("Search contacts").fill("learner.seed@example.com");
  await page.getByLabel("Contacts per page").selectOption("50");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=learner.seed%40example.com/);
  await expect(page).toHaveURL(/pageSize=50/);
  await expect(page.getByText("No public directory members found")).toBeVisible();
  await page.getByRole("link", { name: "Clear search" }).click();
  await tabs.getByRole("link", { name: "Teachers" }).click();
  await expect(page.locator('a[href$="/' + SEED_IDS.learnerCollegeAMembership + '"]')).toHaveCount(0);
  await tabs.getByRole("link", { name: "Students" }).click();
  await expect(page.locator('a[href$="/' + SEED_IDS.learnerCollegeAMembership + '"]')).toBeVisible();
});

test("Faculty Contacts shows authorized public profile cards on mobile without private emails", async ({ page, context }) => {
  await facultyLogin(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/teacher/contacts/students?pageSize=10");
  await expect(page.getByRole("heading", { level: 1, name: "Contacts" })).toBeVisible();
  const card = page.locator("article").filter({
    has: page.locator('a[href$="/' + SEED_IDS.learnerCollegeAMembership + '"]'),
  });
  await expect(card).toBeVisible();
  await expect(card.getByRole("list", { name: "Current college roles" })).toContainText("Student");
  await expect(card).not.toContainText("learner.seed@example.com");
  await expect(page.getByRole("link", { name: "Students" })).toHaveAttribute("aria-current","page");
});

test("Faculty Students exports only the filtered Section roster as spreadsheet-safe CSV", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Students" }).click();
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
  await page.getByLabel("Search students").fill("learner.seed@example.com");
  await expect(page.getByRole("button", { name: "Download roster CSV" })).toBeEnabled();
  const downloadStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download roster CSV" }).click();
  const download = await downloadStarted;
  expect(download.suggestedFilename()).toMatch(/^faculty-roster-.*\.csv$/);
  const downloaded = await readFile((await download.path())!, "utf8");
  expect(downloaded).toContain("Student,Roll number");
  expect(downloaded).not.toContain("learner.seed@example.com");
  expect(downloaded).not.toContain("Email,Phone");
  expect(downloaded).not.toContain("E2E Section B Secret");
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
