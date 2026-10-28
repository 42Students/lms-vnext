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


 test("learner personal history is private, bounded and paged",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  const own="/api/placements/requests/general";
  const first=await page.request.get(own+"?page=1&pageSize=10");
  expect(first.status()).toBe(200);
  expect(first.headers()["cache-control"]).toContain("private");
  expect(first.headers()["cache-control"]).toContain("no-store");
  const one=await first.json() as {
   requests:Array<{id:string;status:string;kind:string}>;page:number;pageSize:number;
   total:number;totalPages:number;cohortId:string|null;
  };
  expect(one.page).toBe(1);
  expect(one.pageSize).toBe(10);
  expect(one.requests.length).toBeLessThanOrEqual(10);
  expect(one.total).toBeGreaterThanOrEqual(one.requests.length);
  expect(one.totalPages).toBe(Math.max(1,Math.ceil(one.total/10)));
  const next=await page.request.get(own+"?page=2&pageSize=10");
  expect(next.status()).toBe(200);
  const two=await next.json() as typeof one;
  expect(two.page).toBe(2);
  expect(two.total).toBe(one.total);
  const firstIds=new Set(one.requests.map(row=>row.id));
  expect(two.requests.every(row=>!firstIds.has(row.id))).toBe(true);
  for(const query of ["?collegeId=foreign","?membershipId=other","?page=1&page=2",
   "?pageSize=10&pageSize=20","?page=0","?pageSize=1000"]){
   expect((await page.request.get(own+query)).status(),query).toBe(400);
  }
  await page.goto("/learn/my-placements/placement");
  const region=page.locator('section[aria-labelledby="learner-general-requests-title"]');
  await expect(region.getByRole("heading",{name:"Your requests"})).toBeVisible();
  if(one.total>0){
   await expect(region.getByRole("navigation",{name:"Your request history pages"}))
    .toContainText(/Page 1 of/);
  }else{
   await expect(region.getByText(/Need more time on an offer/)).toBeVisible();
  }
  await expectNoRawErrors(page);
 });

 test("TPO cannot enumerate learner private general-request history",async({page,context})=>{
  await authenticateGracefulRole(context,"tpo");
  const response=await page.request.get("/api/placements/requests/general?page=1&pageSize=10");
  expect([401,403]).toContain(response.status());
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
