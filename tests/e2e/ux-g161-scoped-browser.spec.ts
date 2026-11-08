import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const origin="http://localhost:3000";

test.describe("UX-G161 Tracker — isolated persisted and responsive acceptance",()=>{
 test.skip(!enabled,"Isolated seeded PostgreSQL and ephemeral role credentials required");

 test("Super Admin reports an issue, changes its real workflow, and rejects a stale retry",async({page,context},info)=>{
  test.setTimeout(120_000);
  await authenticateGracefulRole(context,"superadmin");
  await page.setViewportSize({width:1280,height:800});
  await page.goto("/tracker");
  await expect(page.getByRole("heading",{level:1,name:"What went wrong?"})).toBeVisible();
  await page.getByRole("textbox",{name:"Reporter"}).fill("G161 acceptance");
  await page.getByLabel("Account used").selectOption("SUPER_ADMIN");
  await page.getByLabel("Environment").selectOption("DEVELOPMENT");
  const where=page.getByRole("group",{name:"Where did this happen?"}).locator("select");
  await where.nth(0).selectOption("Dashboard");
  await where.nth(1).selectOption("Overview");
  await page.getByLabel("What kind of issue?").selectOption("UI / Alignment");
  await page.getByLabel("What went wrong?").fill("G161: persisted Tracker workflow and stale revision acceptance.");
  const receipt=page.waitForResponse(r=>
   r.url().endsWith("/api/tracker/issues")&&r.request().method()==="POST");
  await page.getByRole("button",{name:"Report issue",exact:true}).click();
  expect((await receipt).status(),"Report must persist").toBe(201);
  const detailLink=page.getByRole("link",{name:"View issue"});
  await expect(detailLink).toBeVisible();
  const href=await detailLink.getAttribute("href");
  const id=href?.match(/\/tracker\/issues\/(LMS-[0-9]+)$/)?.[1];
  expect(id,"Committed issue public ID must be visible").toMatch(/^LMS-[0-9]+$/);
  await page.screenshot({path:info.outputPath("g161-report-desktop.png"),fullPage:true});
  await detailLink.click();
  await expect(page).toHaveURL(new RegExp("/tracker/issues/"+id+"$"));
  const statusSection=page.getByRole("heading",{level:2,name:"Issue status",exact:true}).locator("..");
  await expect(statusSection).toContainText(/Version \d+/);
  const initialText=await statusSection.innerText();
  const before=Number(initialText.match(/Version (\d+)/)?.[1]);
  expect(Number.isSafeInteger(before),"Version must appear in the actual UI").toBe(true);
  const mutation=page.waitForResponse(r=>r.url().endsWith("/api/tracker/issues/"+id+"/workflow")&&
   r.request().method()==="PATCH");
  await statusSection.locator("..").locator("select").first().selectOption("CHECKING");
  const response=await mutation;
  expect(response.status(),"The status transition must persist").toBe(200);
  const data=await response.json() as {currentVersion:number;status:string};
  expect(data.status).toBe("CHECKING");
  expect(data.currentVersion).toBeGreaterThan(before);
  // The original tab's version must not be replayable after the committed transition.
  const stale=await page.request.patch("/api/tracker/issues/"+id+"/workflow",{
   headers:{origin},data:{expectedVersion:before,status:"FIXING"},
  });
  expect(stale.status(),"Compare-and-set must reject outdated writes").toBe(409);
  const current=await page.request.get("/api/tracker/issues/"+id);
  expect(current.status()).toBe(200);
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await expect(page.getByRole("heading",{level:2,name:"Issue status",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"Issue status",exact:true}).locator(".."))
   .toContainText("Version "+data.currentVersion);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({path:info.outputPath("g161-updated-issue-mobile.png"),fullPage:true});
 });

 test("Learner cannot access global logs, send Telegram alerts, or mutate tracker workflow",async({page,context},info)=>{
  await authenticateGracefulRole(context,"learner");
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tracker");
  await expect(page.getByRole("heading",{level:1,name:"What went wrong?"})).toBeVisible();
  const logs=await page.request.get("/api/tracker/live-logs");
  expect(logs.status()).toBe(403);
  expect(logs.headers()["content-type"]??"").not.toContain("text/csv");
  const alert=await page.request.post("/api/tracker/logs/manual-alert",{
   headers:{origin},data:{kind:"TEST"},
  });
  expect(alert.status(),"The provider action must deny a Learner before sending").toBe(403);
  const workflow=await page.request.patch("/api/tracker/issues/LMS-0001/workflow",{
   headers:{origin},data:{expectedVersion:0,status:"FIXING"},
  });
  expect(workflow.status(),"No private workflow edit to a Learner").toBe(403);
  await page.goto("/tracker/logs");
  await expect(page.getByRole("heading",{name:"Logs access"})).toBeVisible();
  await expect(page.getByText("Sign in with an authorized Super Admin account")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({path:info.outputPath("g161-denied-learner-mobile.png"),fullPage:true});
 });

 test("Global logs show invalid-filter recovery and honest unconfigured state",async({page,context},info)=>{
  await authenticateGracefulRole(context,"superadmin");
  await page.setViewportSize({width:1280,height:800});
  await page.goto("/tracker/logs?environment=INVALID");
  await expect(page.getByText("Invalid log environment.")).toBeVisible();
  await page.getByRole("link",{name:"Reset filter"}).click();
  await expect(page.getByRole("heading",{level:1,name:"Logs"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Live Logs"})).toBeVisible();
  await expect(page.getByText(/Cloud log collection not configured/)).toBeVisible();
  await expect(page.getByText(/Known errors persistence is not enabled/)).toBeVisible();
  await page.screenshot({path:info.outputPath("g161-logs-unconfigured-desktop.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({path:info.outputPath("g161-logs-unconfigured-mobile.png"),fullPage:true});
 });

 test("Quick report never copies a sensitive URL query string into issue drafts",async({page,context})=>{
  await authenticateGracefulRole(context,"superadmin");
  const token="G161_PRIVATE_QUERY_CANARY_20261108";
  await page.goto("/tracker?reset_token="+token);
  await page.getByRole("button",{name:/Report issue · Alt\+B/}).click();
  const drawer=page.getByRole("dialog",{name:"Report an issue"});
  await expect(drawer).toBeVisible();
  const contextText=await drawer.locator("pre").textContent();
  expect(contextText).toContain("[query parameters omitted for privacy]");
  expect(contextText).not.toContain(token);
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
 });
});
