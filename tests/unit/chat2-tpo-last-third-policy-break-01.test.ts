import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoVerificationQuerySchema,parseTpoVerificationParams,tpoVerificationHref,tpoVerificationStatuses,
 tpoVerificationWaitingDateRange,
} from "@/modules/verification/tpo-queue-server-model";
import {publicPlacementSettingState} from "@/modules/placements/public-page/publication-view-model";
import {readOptionalPublicPlacementData} from "@/modules/placements/public-page/optional-read-model";

const uuid="00000000-0000-4000-8000-000000000001";

describe("TPO-BREAK-last-third-01 verification, published stats and export filters",()=>{
 it("rejects forged page sizes, invalid tabs, unscoped arbitrary identifiers and oversized searches",()=>{
  const valid={tab:"WAITING",kind:"ALL",waitingState:"ALL",waitingSince:"ALL",
   search:"Ada",page:1,pageSize:25,batchId:uuid};
  expect(tpoVerificationQuerySchema.safeParse(valid).success).toBe(true);
  for(const patch of [{tab:"DELETED"},{kind:"INTERNAL"},{page:0},{page:-1},
   {page:1.5},{pageSize:999},{pageSize:-1},{batchId:"other-campus"},
   {search:"X".repeat(101)},{collegeId:uuid},{branchId:"cross-tenant-string"}])
   expect(tpoVerificationQuerySchema.safeParse({...valid,...patch}).success).toBe(false);
 });
 it("UX-tpo-LAST-THIRD-01 denies ambiguous and extra URL selectors before an authorized verification read",()=>{
  for(const invalid of [
   {tab:["WAITING","VERIFIED"]},{page:["1","2"]},{kind:["ALL"]},
   {search:["Ada","Bob"]},{batchId:[uuid,uuid]},{branchId:[uuid,uuid]},
   {waitingSince:["TODAY","WEEK"]},{waitingState:["ALL","SUBMITTED"]},
   {collegeId:uuid},{membershipId:uuid},{page:"1e6"},
   {status:"ACTIVE"},{pageSize:"2000"},{tab:"SPOOFED"},
  ])expect(parseTpoVerificationParams(invalid),JSON.stringify(invalid)).toBeNull();
  expect(parseTpoVerificationParams({page:"2",tab:"WAITING",search:" Ada "}))
   .toMatchObject({page:2,tab:"WAITING",search:"Ada"});
  const page=readFileSync("src/app/(authenticated)/tpo/verification/page.tsx","utf8");
  expect(page).toContain("parseTpoVerificationParams(params)");
  expect(page).toContain("if(!parsed)return");
  expect(page).toContain("No verification records were loaded");
 });
 it("encodes search strings and preserves all verified filters across pagination",()=>{
  const input=tpoVerificationQuerySchema.parse({
   tab:"SENT_BACK",kind:"IDENTITY",waitingState:"UPDATE_PENDING",
   waitingSince:"OVER_WEEK",search:"A & B / C",page:2,pageSize:50,
   batchId:uuid,branchId:uuid,
  });
  const href=tpoVerificationHref(input);
  const route=new URL(href,"https://portal.example.org");
  expect(route.pathname).toBe("/tpo/verification");
  expect(route.searchParams.get("search")).toBe("A & B / C");
  expect(route.searchParams.get("batchId")).toBe(uuid);
  expect(route.searchParams.get("branchId")).toBe(uuid);
  expect(route.searchParams.get("page")).toBe("2");
  expect(route.searchParams.get("pageSize")).toBe("50");
  expect(route.search).not.toContain("<script>");
  expect(tpoVerificationStatuses(input).length).toBeGreaterThan(0);
 });
 it("interprets waiting windows in IST and never treats UTC midnight as an India day boundary",()=>{
  const now=new Date("2026-10-20T19:00:00.000Z"); // Oct 21 00:30 IST
  expect(tpoVerificationWaitingDateRange("ALL",now)).toEqual({});
  expect(tpoVerificationWaitingDateRange("TODAY",now).after?.toISOString())
   .toBe("2026-10-20T18:30:00.000Z");
  expect(tpoVerificationWaitingDateRange("WEEK",now).after?.toISOString())
   .toBe("2026-10-14T18:30:00.000Z");
  expect(tpoVerificationWaitingDateRange("OVER_WEEK",now).before?.toISOString())
   .toBe("2026-10-13T18:30:00.000Z");
 });
 it("refuses public statistics for cohorts smaller than 5 and never assumes a failed read means zero",async()=>{
  const inaccessible=publicPlacementSettingState({ready:false});
  expect(inaccessible).toEqual({label:"Public placement storage is unavailable.",
   canEnable:false,enabled:false,populationCount:null});
  expect(publicPlacementSettingState({ready:true,settings:null,populationCount:4}).canEnable).toBe(false);
  expect(publicPlacementSettingState({ready:true,settings:null,populationCount:5}).canEnable).toBe(true);
  expect(publicPlacementSettingState({ready:true,settings:null,populationCount:Number.NaN}).canEnable).toBe(false);
  expect(publicPlacementSettingState({ready:true,settings:null,populationCount:5.2}).canEnable).toBe(false);
  const rejected=await readOptionalPublicPlacementData(async()=>{throw Error("secret connection details");});
  expect(rejected).toEqual({available:false,value:null});
  expect(JSON.stringify(rejected)).not.toContain("secret");
  const accepted=await readOptionalPublicPlacementData(async()=>({count:6}));
  expect(accepted).toEqual({available:true,value:{count:6}});
 });
});
