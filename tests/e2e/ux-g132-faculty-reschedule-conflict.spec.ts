import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);

test.describe("UX-G132 — Faculty schedule version and responsive confirmation", () => {
  test.skip(!enabled, "Requires disposable PostgreSQL and authenticated seeded Faculty");

  test("Faculty cancels a reschedule, persists an edit, and cannot replay an outdated version", async ({page,context}, info) => {
    test.setTimeout(120_000);
    await authenticateGracefulRole(context, "faculty");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/teacher/courses");
    const href = await page.getByRole("link",{name:/E2E Browser Course/}).first().getAttribute("href");
    expect(href).toMatch(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
    const deliveryId = href!.split("/")[3]!;
    const day = String(17 + info.retry).padStart(2,"0");
    const originalStart = `2027-04-${day}T09:00:00+05:30`;
    const originalEnd = `2027-04-${day}T10:00:00+05:30`;
    const newStart = `2027-04-${day}T11:00`;
    const newEnd = `2027-04-${day}T12:00`;
    const schedulePath = "/api/courses/faculty/attendance/" + deliveryId + "/schedule";

    const created = await page.evaluate(async ({path,startsAt,endsAt}) => {
      const result = await fetch(path,{
        method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"CREATE",title:"G132 Faculty reschedule witness",
          startsAt,endsAt,description:null,location:null,confirm:true}),
      });
      return {status:result.status,body:await result.json()};
    },{path:schedulePath,startsAt:new Date(originalStart).toISOString(),endsAt:new Date(originalEnd).toISOString()});
    expect(created.status,JSON.stringify(created.body)).toBe(200);
    const first = created.body.result as {id:string;updatedAt:string};
    expect(first.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(Number.isNaN(Date.parse(first.updatedAt))).toBe(false);

    await page.goto("/teacher/courses/"+deliveryId+"/attendanceDetail?schedule=1");
    const editor = page.getByRole("region",{name:"Faculty attendance session scheduling"});
    await expect(editor).toBeVisible();
    await editor.getByLabel("Action").selectOption("RESCHEDULE");
    await editor.getByLabel("Unmarked session").selectOption(first.id);
    await expect(editor.getByText("No schedule details have changed.")).toBeVisible();
    await expect(editor.getByRole("button",{name:"Confirm reschedule"})).toBeDisabled();
    await editor.getByLabel("Start (IST)").fill(newStart);
    await editor.getByLabel("End (IST)").fill(newEnd);
    await editor.getByRole("button",{name:"Confirm reschedule"}).click();
    const dialog = page.getByRole("alertdialog",{
      name:"Confirm reschedule this Faculty attendance session?",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"Cancel"}).click();
    await expect(dialog).toHaveCount(0);

    await editor.getByRole("button",{name:"Confirm reschedule"}).click();
    const receipt = page.waitForResponse(r=>
      r.url().endsWith(schedulePath) && r.request().method()==="POST");
    await page.getByRole("alertdialog",{
      name:"Confirm reschedule this Faculty attendance session?",
    }).getByRole("button",{name:"Confirm reschedule"}).click();
    const saved = await receipt;
    expect(saved.status(),"The changed session must be persisted").toBe(200);
    // The editor starts router.refresh immediately after a 200 and can abort
    // consuming that response body. Re-open the persisted session instead of
    // mistaking the successful write for a timeout (and retrying it twice).
    await expect(editor.getByText("Session rescheduled.")).toBeVisible();
    await page.goto("/teacher/courses/"+deliveryId+"/attendanceDetail?schedule=1");
    const persistedEditor=page.getByRole("region",{name:"Faculty attendance session scheduling"});
    await persistedEditor.getByLabel("Action").selectOption("RESCHEDULE");
    await persistedEditor.getByLabel("Unmarked session").selectOption(first.id);
    await expect(persistedEditor.getByLabel("Start (IST)")).toHaveValue(newStart);
    await expect(persistedEditor.getByLabel("End (IST)")).toHaveValue(newEnd);
    await page.screenshot({path:info.outputPath("g132-faculty-rescheduled-desktop.png"),fullPage:true});

    const staleStatus = await page.evaluate(async ({path,sessionId,expectedUpdatedAt,startsAt,endsAt}) => {
      const result = await fetch(path,{
        method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"RESCHEDULE",sessionId,expectedUpdatedAt,
          title:"G132 stale edit must be rejected",description:null,location:null,
          startsAt,endsAt,confirm:true}),
      });
      return result.status;
    },{path:schedulePath,sessionId:first.id,expectedUpdatedAt:first.updatedAt,
      startsAt:new Date(`2027-04-${day}T13:00:00+05:30`).toISOString(),
      endsAt:new Date(`2027-04-${day}T14:00:00+05:30`).toISOString()});
    expect(staleStatus,"Stale compare-and-set schedule edits must not overwrite saved data").toBe(409);

    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth))
      .toBeLessThanOrEqual(2);
    await page.screenshot({path:info.outputPath("g132-faculty-rescheduled-mobile.png"),fullPage:true});
  });
});
