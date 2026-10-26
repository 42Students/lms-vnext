import {test,expect} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
test.describe("Recruiter Calendar: latest week and private ICS download",()=>{
 test.skip(!enabled,"Requires verified employer-college grant");
 test("week canvas and safe calendar file use the current authorized college",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/recruiter/calendar");
  await expect(page.getByRole("heading",{name:"Calendar",exact:true})).toBeVisible();
  await expect(page.getByRole("link",{name:"This week"})).toBeVisible();
  const download=page.getByRole("link",{name:"Add to my calendar (.ics)"});
  await expect(download).toHaveAttribute("href",/\/api\/placements\/recruiter\/calendar\/ics\?/);
  const href=await download.getAttribute("href");
  expect(href).toBeTruthy();
  const result=await page.request.get(href!);
  expect(result.ok()).toBe(true);
  expect(result.headers()["content-type"]).toMatch(/^text\/calendar/);
  expect(result.headers()["cache-control"]).toMatch(/no-store/);
  expect(await result.text()).toContain("BEGIN:VCALENDAR");
  await expectNoRawErrors(page);
 });
 test("ungranted college cannot be downloaded, regardless of supplied dates",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  const result=await page.request.get("/api/placements/recruiter/calendar/ics?from=2026-10-26&to=2026-11-01&collegeId=20000000-0000-4000-8000-000000000002");
  expect(result.status()).toBe(403);
  expect(result.headers()["content-type"]).not.toMatch(/text\/calendar/);
 });
});
