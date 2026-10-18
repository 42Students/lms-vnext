import {describe,expect,it} from "vitest";
import {indiaDayStart,indiaDayEndExclusive}
 from "@/modules/bug-tracker/audit-findings-day-model";
import {TrackerAdminError}
 from "@/modules/bug-tracker/admin-errors";
import {parseIndependentFindingFilters,independentFindingHref}
 from "@/modules/bug-tracker/independent-audit-findings-model";

describe("HR-BREAK-tracker-01: shared issue-report audit, IST and strict filters",()=>{
 it("uses precise IST midnight and exclusive next-day boundary without DST",()=>{
  const a=indiaDayStart("2026-10-18");
  const b=indiaDayEndExclusive("2026-10-18");
  expect(a.toISOString()).toBe("2026-10-17T18:30:00.000Z");
  expect(b.toISOString()).toBe("2026-10-18T18:30:00.000Z");
  expect(b.getTime()-a.getTime()).toBe(86_400_000);
  expect(indiaDayEndExclusive("2028-02-29").toISOString())
   .toBe("2028-02-29T18:30:00.000Z");
 });
 it("rejects malformed and calendar-impossible filters rather than silently querying another day",()=>{
  for(const value of ["2026-02-29","2026-13-01","2026-00-01",
   "2026-04-31","2026-10-18T00:00","2026/10/18","",
   "2026-10-18<script>"]){
   expect(()=>indiaDayStart(value)).toThrow("INVALID_IST_DATE");
   expect(()=>indiaDayEndExclusive(value)).toThrow("INVALID_IST_DATE");
  }
 });
 it("typed administrative errors preserve stable machine codes, never raw database internals",()=>{
  for(const code of ["FORBIDDEN","ISSUE_NOT_FOUND","STALE_VERSION","INVALID_INPUT"] as const){
   const error=new TrackerAdminError(code);
   expect(error).toBeInstanceOf(Error);
   expect(error.name).toBe("TrackerAdminError");
   expect(error.code).toBe(code);
   expect(error.message).toBe(code);
  }
 });
 it("filters reject hidden query keys, unknown states and mixed scalar/array pagination",()=>{
  expect(parseIndependentFindingFilters({status:["NEW","IN_PROGRESS"],page:"2"}))
   .toMatchObject({statuses:["NEW","IN_PROGRESS"],page:2});
  for(const invalid of [
   {status:"ADMIN_OVERRIDE"},{view:"DELETE"},{page:["1","2"]},
   {q:"x".repeat(121)},{area:"x".repeat(81)},{page:"0"},
   {collegeId:"other-tenant"},{kind:"PRIVATE"},
  ]){
   expect(parseIndependentFindingFilters(invalid)).toBeNull();
  }
  const view=parseIndependentFindingFilters({view:"ALL",status:["NEW","NEEDS_INFO"],q:"audit"});
  expect(view).not.toBeNull();
  if(view){
   const href=independentFindingHref(view,3);
   expect(href).toContain("page=3");
   expect(href).toContain("status=NEW");
   expect(href).toContain("status=NEEDS_INFO");
   expect(href).not.toContain("collegeId=");
  }
 });
});