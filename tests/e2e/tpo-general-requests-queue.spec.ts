import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const api="/api/placements/tpo/requests/general";

test.describe("TPO other student requests — authenticated queue and privacy",()=>{
 test.skip(!enabled,"Requires the seeded disposable TPO, learner and staged general-requests table");

 test("TPO receives only a bounded, private status/kind/search page",async({page,context})=>{
  await authenticateGracefulRole(context,"tpo");
  const result=await page.request.get(api+"?page=1&pageSize=10&status=PENDING&kind=ALL");
  expect(result.status()).toBe(200);
  expect(result.headers()["cache-control"]).toContain("private");
  expect(result.headers()["cache-control"]).toContain("no-store");
  const value=await result.json() as {
   requests:Array<{id:string;status:string;kind:string}>;total:number;page:number;pageSize:number;
   totalPages:number;status:string;kind:string;q:string;
  };
  expect(Array.isArray(value.requests)).toBe(true);
  expect(value.requests.length).toBeLessThanOrEqual(10);
  expect(value.requests.every(row=>row.status==="PENDING")).toBe(true);
  expect(value.total).toBeGreaterThanOrEqual(value.requests.length);
  expect(value.page).toBe(1);expect(value.pageSize).toBe(10);
  expect(value.status).toBe("PENDING");expect(value.kind).toBe("ALL");
  expect(value.q).toBe("");
  for(const q of ["?collegeId=foreign","?userId=another","?page=1&page=2",
   "?kind=ALL&kind=ABSENCE_DISPUTE","?q=A","?pageSize=1000"]){
   expect((await page.request.get(api+q)).status(),q).toBe(400);
  }
 });

 test("TPO status, kind and submitted-search filters reflect server results",async({page,context})=>{
  test.setTimeout(90_000);
  await authenticateGracefulRole(context,"tpo");
  await page.goto("/tpo/requests");
  await expect(page.getByRole("heading",{level:1,name:"Requests"})).toBeVisible();
  const advanced=page.locator('details[data-slot="disclosure"]').filter({
   has:page.locator("summary").filter({hasText:"Advanced request table, exports and additional request tools"}),
  }).first();
  await advanced.locator(":scope > summary").click();
  // Target the nested disclosure summary directly, not the parent <details>
  // whose descendant text also contains the child title.
  const other=advanced.locator('details[data-slot="disclosure"] > summary')
   .filter({hasText:"Other student requests"});
  await other.click();
  const region=page.getByRole("region",{name:"Other student requests"});
  await expect(region).toBeVisible();
  await expect(region.getByRole("navigation",{name:"Other request history pages"})).toBeVisible();
  let response=page.waitForResponse(r=>r.url().includes(api)&&
   new URL(r.url()).searchParams.get("status")==="APPROVED");
  await region.getByLabel("View requests").selectOption("APPROVED");
  expect((await response).status()).toBe(200);
  response=page.waitForResponse(r=>r.url().includes(api)&&
   new URL(r.url()).searchParams.get("kind")==="ABSENCE_DISPUTE");
  await region.getByLabel("Request kind").selectOption("ABSENCE_DISPUTE");
  expect((await response).status()).toBe(200);
  const search=region.getByRole("search",{name:"Find general student requests"});
  await search.getByRole("searchbox",{name:"Student name or request reason"}).fill("UnknownReview");
  response=page.waitForResponse(r=>r.url().includes(api)&&
   new URL(r.url()).searchParams.get("q")==="UnknownReview");
  await search.getByRole("button",{name:"Find"}).click();
  expect((await response).status()).toBe(200);
  await expect(region.getByRole("navigation",{name:"Other request history pages"}))
   .toContainText(/Page 1 of/);
  await expectNoRawErrors(page);
 });

 test("learner cannot read another role's general request inbox",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  const result=await page.request.get(api+"?status=ALL");
  expect([401,403]).toContain(result.status());
  await page.goto("/tpo/requests");
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  await expect(page.getByRole("heading",{name:"Requests",level:1})).toHaveCount(0);
 });
});
