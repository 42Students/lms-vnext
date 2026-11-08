import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const exports = [
  {id:"class-teams", header:"Team,Membership ID,Roll number", value:"తెలుగు Team",
    escaped:"'\u2060=HYPERLINK(1)", notice:""},
  {id:"learner-activity", header:"UTC time,Actor,Subject,Summary", value:"a".repeat(239)+"😀",
    escaped:"'\u202e+FORMULA", notice:""},
  {id:"mentor-activity", header:"Event ID,Recorded event,Importance,Occurred (IST)", value:"event-1",
    escaped:"'=FORMULA", notice:"2 additional recorded events"},
  {id:"mentor-calendar", header:"Meeting ID,Project,Meeting,Status,Start (IST),End (IST)", value:"Truncated export",
    escaped:"", notice:"3 additional matching meetings"},
  {id:"mentor-portfolio", header:"Event ID,Project,Recorded event,Importance,Occurred (IST)", value:"Example Project",
    escaped:"'=FORMULA", notice:"2 additional matching events"},
  {id:"mentor-reviews", header:"Project ID,Assigned project,Review needed,Submitted (IST)", value:"Example Project",
    escaped:"", notice:"4 more matching deliveries"},
  {id:"mentor-task-reviews", header:"Review ID,Project,Task,Version,Decision,Reviewed (IST)", value:"Example Project",
    escaped:"'@Untrusted task", notice:"5 additional reviewed versions"},
] as const;

for (const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const) {
  for (const sample of exports) {
    test(`${viewport.name}: ${sample.id} preserves scoped serializer and empty CSV downloads`, async ({page}, info) => {
      await page.setViewportSize(viewport);
      await page.goto("/e2e/ux-g182-export-downloads");
      await expect(page.getByRole("heading", {level:1,name:"Project export test downloads"})).toBeVisible();
      const section=page.getByRole("region",{name:sample.id});
      await expect(section).toBeVisible();
      for (const variant of ["sample","empty"] as const) {
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          section.getByRole("link",{name:`Download ${sample.id} ${variant}`}).click(),
        ]);
        expect(download.suggestedFilename()).toBe(`${sample.id}-${variant}.csv`);
        const downloadedPath=await download.path();
        expect(downloadedPath).toBeTruthy();
        const csv=await readFile(downloadedPath!,"utf8");
        expect(csv.replace(/^\uFEFF/,"").startsWith(sample.header)).toBe(true);
        expect(csv).toContain("\r\n");
        // An empty export must contain only its header; it must not include fake rows.
        if (variant==="empty") {
          expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(1);
        } else {
          expect(csv).toContain(sample.value);
          if (sample.escaped) expect(csv).toContain(sample.escaped);
          if (sample.notice) expect(csv).toContain(sample.notice);
          if (sample.id==="learner-activity") expect(csv).not.toContain("😀tail");
        }
        expect(csv).not.toContain("actorEmail");
        expect(csv).not.toContain("joinUrl");
        expect(csv).not.toContain("learner_email");
        expect(csv).not.toContain("reviewNotes");
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
      await page.screenshot({path:info.outputPath(`g182-${sample.id}-${viewport.name}.png`),fullPage:true});
    });
  }
}

test("anonymous requests cannot download protected mentor project CSV endpoints",async({request})=>{
  for(const path of [
    "/api/mentor/calendar/export",
    "/api/mentor/task-review-history/export",
    "/api/mentor/activity/export",
    "/api/mentor/reviews/export",
    "/api/projects/00000000-0000-4000-8000-000000000001/mentor-activity-export",
  ]) {
    const response=await request.get(path,{maxRedirects:0});
    expect([401,403,302,307,308],`${path} denies an anonymous export`).toContain(response.status());
    expect(response.headers()["content-type"]??"").not.toContain("text/csv");
    expect(response.headers()["content-disposition"]??"").not.toContain("attachment");
  }
});
