import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 parseTpoRecruiterAccessParams,tpoRecruiterAccessHref,
} from "@/modules/placements/tpo-recruiter-access-model";
import {
 parseTpoMyNotificationsParams,tpoMyNotificationsHref,
} from "@/modules/placements/tpo-my-notifications-model";

describe("TPO-settings-audit-RECRUIT-04 recruiter grant query is deterministic and bounded",()=>{
 it("accepts a canonical filtered page and preserves the legacy recruiter access URL",()=>{
  const valid=parseTpoRecruiterAccessParams({status:"ACTIVE",q:" Placement ",page:"002"});
  expect(valid).toEqual({status:"ACTIVE",q:"Placement",page:2});
  expect(tpoRecruiterAccessHref(valid??{})).toBe("/tpo/settings/recruiters?q=Placement&status=ACTIVE&page=2");
  expect(parseTpoRecruiterAccessParams({})).toEqual({status:"ALL",q:"",page:1});
 });
 it("refuses repeated/unsupported keys, scientific and hexadecimal pages and negative/oversize pages",()=>{
  for(const hostile of [
   {status:["ACTIVE","REVOKED"]},{page:["1","2"]},{q:["a","b"]},
   {collegeId:"foreign"},{organizationId:"foreign"},
   {page:"1e2"},{page:"0x10"},{page:"+1"},{page:" 2 "},
   {page:"0"},{page:"10001"},{page:"1.5"},{status:"UNKNOWN"},
   {q:"x".repeat(81)},
  ]){
   expect(parseTpoRecruiterAccessParams(hostile),JSON.stringify(hostile)).toBeNull();
  }
 });
 it("does not load any grants until the entire query parses successfully",()=>{
  const source=readFileSync("src/app/(authenticated)/tpo/settings/recruiters/page.tsx","utf8");
  const parsing=source.indexOf("parseTpoRecruiterAccessParams(params)");
  const error=source.indexOf("if (!parsed)");
  const load=source.indexOf("listTpoRecruiterAccess(context, parsed)");
  expect(parsing).toBeGreaterThan(0);
  expect(error).toBeGreaterThan(parsing);
  expect(load).toBeGreaterThan(error);
  expect(source).toContain('title="Invalid recruiter access filters"');
  expect(source).not.toContain("first(params.");
 });
});

describe("TPO-settings-audit-NOTIFY-03 user-only notification query",()=>{
 it("preserves read/unread views, defaults and URL roundtrip",()=>{
  expect(parseTpoMyNotificationsParams({})).toEqual({view:"ALL",page:1,pageSize:25});
  const parsed=parseTpoMyNotificationsParams({view:"UNREAD",page:"0002",pageSize:"50"});
  expect(parsed).toEqual({view:"UNREAD",page:2,pageSize:50});
  expect(tpoMyNotificationsHref(parsed??{})).toBe("/tpo/settings/notifications?view=UNREAD&page=2&pageSize=50");
 });
 it("does not choose the first of repeated filters or accept injected user/college IDs",()=>{
  for(const hostile of [
   {view:["READ","UNREAD"]},{page:["1","2"]},{pageSize:["25","100"]},
   {userId:"different"},{collegeId:"foreign"},{organizationId:"foreign"},
   {view:"DRAFT"},{page:"0x10"},{page:"1e1"},{page:"-1"},
   {page:" 1 "},{pageSize:"200"},{pageSize:"0"},
  ]){
   expect(parseTpoMyNotificationsParams(hostile),JSON.stringify(hostile)).toBeNull();
  }
 });
 it("returns a friendly error before any scoped notifications reader runs",()=>{
  const source=readFileSync("src/app/(authenticated)/tpo/settings/notifications/page.tsx","utf8");
  const parsing=source.indexOf("parseTpoMyNotificationsParams(raw)");
  const error=source.indexOf("if (!parsed)");
  const load=source.indexOf("getTpoMyNotifications(");
  expect(parsing).toBeGreaterThan(0);
  expect(error).toBeGreaterThan(parsing);
  expect(load).toBeGreaterThan(error);
  expect(source).toContain('title="Invalid notification filters"');
  expect(source).not.toContain("first(raw.");
 });
});
