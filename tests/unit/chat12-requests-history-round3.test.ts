import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {globalTpoRequestsQuerySchema,tpoRequestDateBounds} from "@/modules/placements/tpo-global-requests-model";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-12 legacy requests history and search scopes",()=>{
 it("TPO-requests-verification-17 shows Waiting, Last 30 days, All history views",()=>{
  const page=src("src/app/(authenticated)/tpo/requests/page.tsx");
  for(const label of ["Waiting","Last 30 days","All history"])expect(page).toContain(label);
  expect(globalTpoRequestsQuerySchema.parse({status:"ALL",age:"LAST_30_DAYS"})).toMatchObject({status:"ALL",age:"LAST_30_DAYS"});
 });
 it("TPO-requests-verification-11 lets TPO search by student number and select a drive or recent period",()=>{
  const page=src("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(page).toContain("Search student, roll, drive or request type");
  expect(page).toContain('name="jobId"');
  expect(page).toContain('name="urgentOnly"');
 });
 it("TPO-requests-verification-12 preserves Needs doing first with waiting and urgent summary",()=>{
  const page=src("src/app/(authenticated)/tpo/requests/page.tsx");
  for(const phrase of ["Needs doing first","Nothing is waiting for you.","Waiting more than 2 days"])expect(page).toContain(phrase);
 });
 it("TPO-requests-verification-17 respects a fixed thirty-day period without status gating",()=>{
  const asOf=new Date("2099-07-01T10:00:00Z");
  const bounds=tpoRequestDateBounds("LAST_30_DAYS",asOf);
  expect(bounds.after?.toISOString()).toBe("2099-06-01T10:00:00.000Z");
  expect(bounds.before).toBeUndefined();
  expect(src("src/modules/placements/tpo-global-requests-service.ts")).toContain('query.status==="ALL"?undefined:query.status');
 });
});
