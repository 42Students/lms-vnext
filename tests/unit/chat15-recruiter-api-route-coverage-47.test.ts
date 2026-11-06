import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const prefix="src/app/api/placements/recruiter/";
const source=(route:string)=>readFileSync(prefix+route+"/route.ts","utf8");

describe("HR-API-MATRIX-47 recruiter write CSRF and GET-only route boundaries",()=>{
 const mutations=[
  ["access/[grantId]","DELETE"],
  ["bell","POST"],
  ["conversations/[threadId]/acknowledge","POST"],
  ["conversations/[threadId]/reply","POST"],
  ["conversations/acknowledge","POST"],
  ["conversations/open","POST"],
  ["drives/[jobId]/interview-slots","POST"],
  ["drives/[jobId]/rounds","POST"],
  ["drives/proposal","POST"],
  ["drives/requests","POST"],
  ["drives/requests","PATCH"],
  ["jobs/[jobId]/applicants/[applicationId]/notes","POST"],
  ["jobs/[jobId]/applicants/[applicationId]/private-rating","PATCH"],
  ["jobs/[jobId]/applicants/[applicationId]/resume-grant","POST"],
  ["notifications/[notificationId]/read","POST"],
  ["profile/details","PATCH"],
  ["profile/name","PATCH"],
  ["profile","PATCH"],
 ] as const;
 it.each(mutations)("HR-API-CSRF-47 %s %s authenticates and rejects foreign-origin mutation before writes",(route,method)=>{
  const code=source(route);
  expect(code).toMatch(new RegExp("export\\s+(?:async\\s+function|const)\\s+"+method+"\\b"));
  expect(code).toMatch(/isSameOriginRequest|from "@\/security\/route"/);
  expect(code).toMatch(/getCurrentRequestContext|from "@\/security\/route"/);
  expect(code).not.toContain("getAllCollegeMembersWithoutScope(");
 });
 const readonly=[
  "activity/export","calendar/export","drives/export",
  "drives/proposals/export","jobs/[jobId]/applicants/export",
  "jobs/[jobId]/offers/export","jobs","notifications/drawer",
  "notifications/export","reports/export","team/export",
 ];
 it.each(readonly)("HR-API-GET-47 %s has a scoped GET and no direct write path",route=>{
  const code=source(route);
  expect(code).toMatch(/export (?:async function|const) GET/);
  expect(code).toMatch(/getCurrentRequestContext|from "@\/security\/route"/);
  for(const method of ["POST","PATCH","PUT","DELETE"])
   expect(code).not.toMatch(new RegExp("export (?:async function|const) "+method+"\b"));
 });
 it("HR-API-REQUEST-IDEMPOTENCY-47 drive request create and update use separately guarded handlers",()=>{
  const code=source("drives/requests");
  expect(code).toContain("createOwnRecruiterDriveRequest");
  expect(code).toContain("updateOwnRecruiterDriveRequest");
  expect(code).toMatch(/isSameOriginRequest|from "@\/security\/route"/);
  expect(code).toContain("readRecruiterJsonBody");
 });
});
