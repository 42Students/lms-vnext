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
  const explorer = page.getByRole("region", { name: "Course blueprint lesson explorer" });
  await expect(explorer).toBeVisible();
  await expect(page.getByText("E2E Section B Secret", { exact: true })).toHaveCount(0);
  const order = explorer.getByRole("list", { name: "Lesson content order" });
  await expect(order).toBeVisible();
  const editContent = order.getByRole("button", { name: "Edit", exact: true }).first();
  await expect(editContent).toBeVisible();
  await editContent.click();
  await expect(page.getByRole("dialog", { name: /Edit (RESOURCE|VIDEO|YOUTUBE|LIVE CLASS|Assignment|Quiz)/i })).toBeVisible();
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
  test.setTimeout(120_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Discussions" }).click();
  const pane=page.locator(".faculty-prototype-discussion");
  const composer=pane.getByRole("textbox",{name:"Write a message"});
  await expect(composer).toBeVisible();
  const message="Faculty cross-course moderation "+Date.now();
  await composer.fill(message);
  const posting=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname.endsWith("/discussions"));
  await pane.getByRole("button",{name:"Send",exact:true}).click();
  const posted=await posting;
  expect(posted.status()).toBe(201);
  const article=pane.getByRole("article").filter({hasText:message});
  await expect(article).toBeVisible();
  const pinned=page.waitForResponse(response=>response.request().method()==="PATCH" &&
    new URL(response.url()).pathname.includes("/discussions/"));
  await article.getByRole("button",{name:/^Pin /}).click();
  expect((await pinned).ok()).toBe(true);
  await expect(article.getByText("Pinned",{exact:true})).toBeVisible();
  const unpinned=page.waitForResponse(response=>response.request().method()==="PATCH" &&
    new URL(response.url()).pathname.includes("/discussions/"));
  await article.getByRole("button",{name:/^Unpin /}).click();
  expect((await unpinned).ok()).toBe(true);
  await article.getByRole("button",{name:/^Delete /}).click();
  const confirmation=page.getByRole("alertdialog",{name:"Delete this message?"});
  await expect(confirmation).toBeVisible();
  const removing=page.waitForResponse(response=>response.request().method()==="DELETE" &&
    new URL(response.url()).pathname.includes("/discussions/"));
  await confirmation.getByRole("button",{name:"Delete",exact:true}).click();
  expect((await removing).ok()).toBe(true);
  await expect(article).toHaveCount(0);
});

test("Faculty Blueprint persists an authorized Section Resource edit after a full reload", async ({ page, context }) => {
  test.setTimeout(120_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).first().click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Blueprint" }).click();
  const explorer=page.getByRole("region",{name:"Course blueprint lesson explorer"});
  const order=explorer.getByRole("list",{name:"Lesson content order"});
  await expect(order).toBeVisible();
  // The actual lesson explorer uses <li> rows and inline Edit actions.
  // The old standalone <article> resource cards no longer exist.
  const openEditor=async()=>{
    await order.getByRole("button",{name:"Edit",exact:true}).first().click();
    const editor=page.getByRole("dialog",{name:"Edit RESOURCE"});
    await expect(editor).toBeVisible();
    return editor;
  };
  const editor=await openEditor();
  const original=await editor.getByLabel("Notes").inputValue();
  const marker="Faculty persisted-resource browser proof "+Date.now();
  const patchNotes=async(value:string)=>{
    const dialog=page.getByRole("dialog",{name:"Edit RESOURCE"});
    await dialog.getByLabel("Notes").fill(value);
    const saving=page.waitForResponse(response=>response.request().method()==="PATCH" &&
      /^\/api\/courses\/lesson-contents\/[^/]+$/.test(new URL(response.url()).pathname));
    await dialog.getByRole("button",{name:"Save content"}).click();
    expect((await saving).ok()).toBe(true);
  };
  try {
    await patchNotes(marker);
    await page.reload();
    await expect(order).toContainText(marker);
    await expect(page.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
  } finally {
    if(!page.isClosed()){
      await page.goto("/teacher/courses");
      await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
      await page.getByRole("navigation",{name:"Faculty course tabs"})
        .getByRole("link",{name:"Blueprint"}).click();
      await openEditor();
      await patchNotes(original);
    }
  }
});

test("Faculty Blueprint creates, edits and archives an own-Section Resource without private storage", async ({page,context}) => {
  test.setTimeout(120_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  await page.getByRole("navigation",{name:"Faculty course tabs"})
    .getByRole("link",{name:"Blueprint"}).click();
  const explorer=page.getByRole("region",{name:"Course blueprint lesson explorer"});
  const activeLessonHref=await explorer.getByRole("complementary")
    .getByRole("link",{current:"page"}).getAttribute("href");
  const lessonId=new URL(activeLessonHref!,page.url()).searchParams.get("lesson");
  expect(lessonId).toMatch(/^[0-9a-f-]{36}$/i);
  const base="/teacher/courses/"+deliveryId+"/blueprint?lesson="+lessonId;
  await page.goto(base+"&advanced=1&create=RESOURCE");
  await expect(page.getByRole("textbox",{name:"Content Title"})).toBeVisible();
  const title="Faculty Section Resource receipt "+Date.now();
  const originalNotes="Disposable Section metadata only";
  const revisedNotes="Persisted authorized Resource edit";
  await page.getByRole("textbox",{name:"Content Title"}).fill(title);
  await page.getByRole("textbox",{name:"Notes (optional)"}).fill(originalNotes);
  await page.getByRole("checkbox",{name:/Publish now/}).uncheck();
  const creating=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname==="/api/courses/lesson-contents");
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await creating;
  expect(created.ok()).toBe(true);
  const contentId:string=(await created.json()).content?.id;
  expect(contentId).toMatch(/^[0-9a-f-]{36}$/i);
  await expect(page.getByText("Resource saved",{exact:true})).toBeVisible();
  await page.goto(base);
  const order=page.getByRole("list",{name:"Lesson content order"});
  const row=order.getByRole("listitem").filter({has:page.getByRole("link",{name:title,exact:true})});
  await expect(row).toBeVisible();
  await row.getByRole("button",{name:"Edit",exact:true}).click();
  const editor=page.getByRole("dialog",{name:"Edit RESOURCE"});
  await editor.getByLabel("Notes").fill(revisedNotes);
  const patching=page.waitForResponse(response=>response.request().method()==="PATCH" &&
    new URL(response.url()).pathname==="/api/courses/lesson-contents/"+contentId);
  await editor.getByRole("button",{name:"Save content"}).click();
  expect((await patching).ok()).toBe(true);
  await expect(editor).toBeHidden();
  await page.goto(base);
  await expect(order).toContainText(revisedNotes);
  await row.getByRole("button",{name:"Remove "+title}).click();
  const confirm=page.getByRole("alertdialog",{name:"Remove "+title+"?"});
  await expect(confirm).toBeVisible();
  const archiving=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname==="/api/courses/lesson-contents/"+contentId+"/transition");
  await confirm.getByRole("button",{name:"Archive item"}).click();
  expect((await archiving).ok()).toBe(true);
  await page.goto(base);
  await expect(order.getByRole("link",{name:title,exact:true})).toHaveCount(0);
});

test("Faculty Students links an authorized roster member to mobile-readable attendance history", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await page.getByRole("navigation", { name: "Faculty course tabs" })
    .getByRole("link", { name: "Students" }).click();
  const detailLink = page.getByRole("region", { name: "Faculty prototype students" })
    .getByRole("row").getByRole("link").first();
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
  // Scheduling is a separate advanced workflow, intentionally collapsed.
  await page.locator("summary").filter({hasText:"Advanced attendance session scheduling"}).click();
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
  await page.getByRole("button", { name: "Create Assignment", exact: true }).click();
  const assignments = page.getByRole("dialog", { name: "Create New Assignment" });
  await expect(assignments.getByRole("combobox", { name: "Select course and class" })).toBeVisible();
  await assignments.getByRole("combobox", { name: "Select course and class" }).selectOption({index:1});
  await assignments.getByRole("combobox", { name: "Select lesson" }).selectOption({index:1});
  // The canonical builder must bind creation to a current teaching
  // Section and an actual lesson before the Save action is enabled.
  await expect(assignments.getByRole("button", { name: "Create", exact: true })).toBeEnabled();
  await assignments.getByRole("button", { name: "Cancel" }).click();

  await page.goto("/teacher/allQuizzes");
  await page.getByRole("button", { name: "Create Quiz", exact: true }).first().click();
  const quizzes = page.getByRole("dialog", { name: "Create Quiz" });
  await quizzes.getByRole("combobox", { name: "Select course and class" }).selectOption({index:1});
  await quizzes.getByRole("combobox", { name: "Select lesson" }).selectOption({index:1});
  await quizzes.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog", { name: "Quiz Builder" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to course and lesson" })).toBeVisible();
});

test("Faculty Assignment aggregate creates, filters, edits and archives an actual Section draft", async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).first().click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  const commandPath="/api/courses/faculty/assignments/"+deliveryId+"/command";
  await page.goto("/teacher/courses/"+deliveryId+"/assignments/manage");
  await expect(page.getByRole("heading",{name:"Assignment authoring"})).toBeVisible();
  const first="Faculty cross-course assignment "+Date.now()+" "+testInfo.retry;
  const renamed=first+" amended";
  await page.getByRole("textbox",{name:"Title",exact:true}).fill(first);
  await page.getByRole("textbox",{name:"Text instructions"}).fill("E2E class-scoped assignment");
  // Publishing requires a future deadline. Use a real persisted value rather than bypassing the guard.
  await page.getByRole("textbox",{name:"Due date (IST, required before publishing)"})
    .fill(new Date(Date.now()+14*86400000).toISOString().slice(0,16));
  await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
  const creating=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await creating;
  expect(created.status()).toBe(200);
  const saved=await created.json();
  const assignmentId:string=saved.assignment?.id;
  expect(assignmentId).toMatch(/^[0-9a-f-]{36}$/i);
  const staleToken:string=saved.assignment.updatedAt;
  await page.reload();
  await page.getByRole("combobox",{name:"Choose draft or create new"})
    .selectOption({label:first+" (DRAFT)"});
  // The editor intentionally blocks writes until the persisted submission methods are authorized and loaded.
  await expect(page.getByRole("group",{name:"Allowed submission methods"})).toBeEnabled();
  await page.getByRole("textbox",{name:"Title",exact:true}).fill(renamed);
  const editing=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Save draft"}).click();
  const edited=await editing;
  expect(edited.status()).toBe(200);
  expect((await edited.json()).assignment.title).toBe(renamed);
  const stale=await page.evaluate(async ({commandPath,assignmentId,staleToken})=>{
    return (await fetch(commandPath,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"ARCHIVE",assignmentId,expectedUpdatedAt:staleToken,confirmed:true})})).status;
  },{commandPath,assignmentId,staleToken});
  expect(stale).toBeGreaterThanOrEqual(400);

  await page.goto("/teacher/allAssignments");
  await expect(page.getByRole("heading",{level:1,name:"My Assignments"})).toBeVisible();
  await page.getByRole("textbox",{name:"Search assessments"}).fill(renamed);
  await page.getByRole("combobox",{name:"Status"}).selectOption("DRAFT");
  const card=page.locator("article").filter({has:page.getByRole("heading",{name:renamed})});
  await expect(card).toBeVisible();
  await expect(card.getByText("This Section",{exact:true}).first()).toBeVisible();
  await card.locator("summary").filter({hasText:/^Actions/}).click();
  await expect(card.getByRole("link",{name:"View Report"}))
    .toHaveAttribute("href",new RegExp("/teacher/report/assignment/"+assignmentId));

  await page.goto("/teacher/courses/"+deliveryId+"/assignments/manage");
  await page.getByRole("combobox",{name:"Choose draft or create new"})
    .selectOption({label:renamed+" (DRAFT)"});
  await expect(page.getByRole("group",{name:"Allowed submission methods"})).toBeEnabled();
  const publishing=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Publish",exact:true}).click();
  expect((await publishing).status()).toBe(200);
  await page.reload();
  await page.getByRole("combobox",{name:"Choose draft or create new"})
    .selectOption({label:renamed+" (PUBLISHED)"});
  await expect(page.getByRole("group",{name:"Allowed submission methods"})).toBeEnabled();
  const archiving=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.locator('details[data-slot="dropdown-root"] > summary')
    .filter({hasText:/^More/}).click();
  await page.getByRole("menuitem",{name:"Archive"}).click();
  await page.getByRole("alertdialog").getByRole("button",{name:"Confirm"}).click();
  const archived=await archiving;
  expect(archived.status()).toBe(200);
  expect((await archived.json()).assignment.status).toBe("ARCHIVED");
  await page.reload();
  await expect(page.getByRole("combobox",{name:"Choose draft or create new"}))
    .not.toContainText(renamed);
  const wrongCollege=await page.evaluate(async({assignmentId,foreignDeliveryId})=>
    (await fetch("/api/courses/faculty/assignments/"+foreignDeliveryId+"/command",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"ARCHIVE",assignmentId,expectedUpdatedAt:new Date().toISOString(),confirmed:true}),
    })).status,{assignmentId,foreignDeliveryId:SEED_IDS.collegeB});
  expect(wrongCollege).toBeGreaterThanOrEqual(400);
});

test("Faculty Quiz aggregate persists questions, metadata edits and archival", async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  await facultyLogin(context);
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  const commandPath="/api/courses/faculty/quizzes/"+deliveryId+"/command";
  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  await expect(page.getByRole("heading",{name:"Choice-question quiz builder"})).toBeVisible();
  const title="Faculty cross-course quiz "+Date.now()+" "+testInfo.retry;
  const revised=title+" amended";
  await page.getByRole("textbox",{name:"Quiz title"}).fill(title);
  await page.getByRole("textbox",{name:"Prompt"}).fill("What is one plus one?");
  await page.getByRole("textbox",{name:"Option 1"}).fill("Two");
  await page.getByRole("textbox",{name:"Option 2"}).fill("Three");
  await page.getByRole("textbox",{name:"Due date (IST, required before publishing)"})
    .fill(new Date(Date.now()+14*86400000).toISOString().slice(0,16));
  await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
  const creating=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await creating;
  expect(created.status()).toBe(200);
  const saved=await created.json();
  const quizId:string=saved.quiz?.id;
  const staleToken:string=saved.quiz?.updatedAt;
  expect(quizId).toMatch(/^[0-9a-f-]{36}$/i);
  const authorized=await page.request.get("/api/courses/quizzes/"+quizId+
    "?deliveryId="+deliveryId+"&includeCorrectAnswers=true");
  expect(authorized.status()).toBe(200);
  const record=await authorized.json();
  const options=record.quiz?.questions?.[0]?.options;
  expect(Array.isArray(options)).toBe(true);
  expect(options.filter((option:{correct?:boolean})=>option.correct===true)).toHaveLength(1);

  await page.reload();
  await page.getByRole("combobox",{name:"Quiz",exact:true})
    .selectOption({label:title+" (DRAFT)"});
  await page.getByRole("textbox",{name:"Quiz title"}).fill(revised);
  await page.getByRole("textbox",{name:"Prompt"}).fill("Which number equals 1 + 1?");
  await page.getByRole("spinbutton",{name:"Maximum attempts"}).fill("3");
  const editing=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Save draft"}).click();
  const edited=await editing;
  expect(edited.status()).toBe(200);
  expect((await edited.json()).quiz.title).toBe(revised);
  const stale=await page.evaluate(async({commandPath,quizId,staleToken})=>
    (await fetch(commandPath,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"ARCHIVE",quizId,expectedUpdatedAt:staleToken,confirmed:true})})).status,
    {commandPath,quizId,staleToken});
  expect(stale).toBeGreaterThanOrEqual(400);

  await page.goto("/teacher/allQuizzes");
  await expect(page.getByRole("heading",{level:1,name:"My Quizzes"})).toBeVisible();
  await page.getByRole("combobox",{name:"Status"}).selectOption("DRAFT");
  await page.getByRole("textbox",{name:"Search assessments"}).fill(revised);
  const card=page.locator("article").filter({has:page.getByRole("heading",{name:revised})});
  await expect(card).toBeVisible();
  await expect(card.getByText("This Section",{exact:true}).first()).toBeVisible();
  await card.locator("summary").filter({hasText:/^Actions/}).click();
  await expect(card.getByRole("link",{name:"View Report"}))
    .toHaveAttribute("href",new RegExp("/teacher/report/quiz/"+quizId));

  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  await page.getByRole("combobox",{name:"Quiz",exact:true})
    .selectOption({label:revised+" (DRAFT)"});
  await expect(page.getByRole("textbox",{name:"Prompt"}))
    .toHaveValue("Which number equals 1 + 1?");
  await expect(page.getByRole("spinbutton",{name:"Maximum attempts"})).toHaveValue("3");
  const archiving=page.waitForResponse(response=>response.request().method()==="POST" &&
    new URL(response.url()).pathname===commandPath);
  await page.locator("summary").filter({hasText:/^Archive quiz/}).click();
  await page.getByRole("button",{name:"Archive quiz"}).click();
  await page.getByRole("alertdialog").getByRole("button",{name:"Confirm"}).click();
  const archived=await archiving;
  expect(archived.status()).toBe(200);
  expect((await archived.json()).quiz.status).toBe("ARCHIVED");
  const foreign=await page.evaluate(async({quizId,foreignDeliveryId})=>
    (await fetch("/api/courses/faculty/quizzes/"+foreignDeliveryId+"/command",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"ARCHIVE",quizId,expectedUpdatedAt:new Date().toISOString(),confirmed:true}),
    })).status,{quizId,foreignDeliveryId:SEED_IDS.collegeB});
  expect(foreign).toBeGreaterThanOrEqual(400);
});

test("Faculty Assessment results filter only assigned teaching Sections and preserve deep links", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/results");
  await expect(page.getByRole("heading", { name: "Assessment results", level: 1 })).toBeVisible();
  // The advanced filters intentionally live behind a disclosure.
  await page.locator("summary").filter({hasText:"More filters"}).click();
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
  // Modern inbox defaults to all categories. Opening Personal is a real,
  // independently authorized category transition, not a hidden heading.
  await page.getByRole("navigation", { name: "Notification categories" })
    .getByRole("link", { name: /^Personal \(/ }).click();
  await expect(page.getByRole("heading", { name: "Personal notifications" })).toBeVisible();
  const filters = page.getByRole("group", { name: "Notification filter" });
  await filters.getByRole("link", { name: /Unread/ }).click();
  await expect(page).toHaveURL(/\/teacher\/notifications\?view=unread&tab=personal$/);
  await expect(page.getByRole("button", { name: "Mark all as read" })).toBeVisible();
  await filters.getByRole("link", { name: "All", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/notifications\?view=all&tab=personal$/);

  await page.goto("/teacher/notifications?view=unread&tab=personal&beforeCreatedAt=invalid&beforeId=bad-id");
  const invalid = page.getByRole("alert").filter({ hasText: "notification filters or page link are invalid" });
  await expect(invalid).toBeVisible();
  await invalid.getByRole("link", { name: "View all notifications" }).click();
  await expect(page).toHaveURL(/\/teacher\/notifications\?view=unread$/);
});

test("Faculty Contacts verifies public-only role cards, scoped search and page size", async ({ page, context }) => {
  await facultyLogin(context);
  await page.goto("/teacher/contacts/allContacts");
  await expect(page.getByRole("heading", { level: 1, name: "All Contacts" })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Contacts sections" });
  for (const label of ["All Contacts", "Teachers", "Students"]) {
    await expect(tabs.getByRole("link", { name: label })).toBeVisible();
  }
  const publicLearner = page.getByRole("row").filter({
    has: page.locator('a[href*="/' + SEED_IDS.learnerCollegeAMembership + '"]'),
  });
  await expect(publicLearner).toBeVisible();
  await expect(publicLearner.getByRole("list", { name: "Current college roles" })).toContainText("Student");
  // The new responsive directory deliberately shows masked columns on
  // desktop rather than removing the entire table.
  await expect(page.getByRole("table", { name: "Contacts directory" })).toBeVisible();
  await expect(publicLearner).toContainText("Private");
  await expect(publicLearner).not.toContainText("learner.seed@example.com");

  // Page-size is an applied filter; search itself is debounced live.
  await page.getByLabel("Rows per page").selectOption("50");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page).toHaveURL(/pageSize=50/);
  await page.getByRole("searchbox", { name: "Search contacts" }).fill("learner.seed@example.com");
  await expect(page).toHaveURL(/q=learner.seed%40example.com/);
  await expect(page.getByText(/No contacts match/)).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByRole("searchbox", { name: "Search contacts" })).toHaveValue("");
  await page.getByRole("navigation", { name: "Contacts sections" })
    .getByRole("link", { name: "Teachers" }).click();
  await expect(page.locator('a[href*="/' + SEED_IDS.learnerCollegeAMembership + '"]')).toHaveCount(0);
  await page.getByRole("navigation", { name: "Contacts sections" })
    .getByRole("link", { name: "Students" }).click();
  await expect(page.locator('a[href*="/' + SEED_IDS.learnerCollegeAMembership + '"]')).toBeVisible();
});

test("Faculty Contacts shows authorized public profile cards on mobile without private emails", async ({ page, context }) => {
  await facultyLogin(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/teacher/contacts/students?pageSize=10");
  await expect(page.getByRole("heading", { level: 1, name: "Students" })).toBeVisible();
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
