import { expect, test } from "@playwright/test";

for (const viewport of [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const) {
  test(`G132 ${viewport.name}: faculty reviews exact IST session details before creating and rescheduling`, async ({page},info) => {
    await page.setViewportSize(viewport);
    let writes=0;
    page.on("request",req=>{
      if (req.method()==="POST" && req.url().includes("/attendance/") && req.url().endsWith("/schedule")) writes++;
    });
    await page.goto("/e2e/ux-g132-faculty-schedule");
    await expect(page.getByRole("heading",{name:"Faculty attendance schedule preview"})).toBeVisible();
    await expect(page.getByRole("heading",{name:"Schedule an attendance session"})).toBeVisible();

    await page.getByLabel("Session title").fill("New algorithms lecture");
    await page.getByLabel("Start (IST)").fill("2099-01-02T10:00");
    await page.getByLabel("End (IST)").fill("2099-01-02T11:00");
    await page.getByText("Additional session details").click();
    await page.getByLabel("Location").fill("Main Hall");
    await page.getByRole("button",{name:"Confirm schedule"}).click();

    const createDialog=page.getByRole("alertdialog",{name:/Confirm schedule this Faculty attendance session/i});
    await expect(createDialog).toBeVisible();
    await expect(createDialog).toContainText("New algorithms lecture");
    await expect(createDialog).toContainText("2099-01-02 10:00 IST");
    await expect(createDialog).toContainText("2099-01-02 11:00 IST");
    await expect(createDialog).toContainText("Location: Main Hall");
    await expect(createDialog).toContainText("This creates one session for this course.");
    await createDialog.getByRole("button",{name:"Cancel"}).click();
    await expect(createDialog).not.toBeVisible();

    await page.getByLabel("Action").selectOption("RESCHEDULE");
    await expect(page.getByRole("heading",{name:"Reschedule an attendance session"})).toBeVisible();
    await expect(page.getByLabel("Session title")).toHaveValue("Existing unmarked class");
    await page.getByLabel("Start (IST)").fill("2099-01-04T10:15");
    await page.getByRole("button",{name:"Confirm reschedule"}).click();
    const updateDialog=page.getByRole("alertdialog",{name:/Confirm reschedule this Faculty attendance session/i});
    await expect(updateDialog).toContainText("Existing unmarked class");
    await expect(updateDialog).toContainText("2099-01-04 10:15 IST");
    await expect(updateDialog).toContainText("2099-01-04 11:00 IST");
    await expect(updateDialog).toContainText("Location: Room A");
    await expect(updateDialog).toContainText("This updates the selected unmarked session.");
    await updateDialog.getByRole("button",{name:"Cancel"}).click();
    expect(writes,"Review and cancellation must never mutate attendance sessions").toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    await page.screenshot({path:info.outputPath(`g132-faculty-schedule-${viewport.name}.png`),fullPage:true});
  });
}

test("G132 faculty schedule fixture is gated from production builds", async () => {
  // This is a static source guard, complementary to deployment environment gating.
  const { readFileSync } = await import("node:fs");
  const source=readFileSync("src/app/e2e/ux-g132-faculty-schedule/page.tsx","utf8");
  expect(source).toContain('process.env.NODE_ENV !== "development"');
  expect(source).toContain('process.env["UX_G132_SCHEDULE_FIXTURE"] !== "1"');
  expect(source).toContain("notFound()");
});
