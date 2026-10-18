import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({scope:vi.fn(),actor:vi.fn(),table:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mock.actor}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mock.table}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
import {getTpoAuditLog,tpoAuditQuerySchema} from "@/modules/placements/tpo-audit-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-audit",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-audit-revoked-06 unauthorized audit and source disclosure",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG,status:"ACTIVE"});
  mock.actor.mockResolvedValue(COLLEGE);
  mock.table.mockResolvedValue(false);
 });
 it("revoked TPO role denies direct service before probing activity or share tables",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(getTpoAuditLog(context,{kind:"SHARE"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.table).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("wrong-college persisted actor cannot enumerate another college's placement activity",async()=>{
  mock.actor.mockResolvedValue(OTHER);
  await expect(getTpoAuditLog(context,{kind:"ACTIVITY"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.table).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("invalid range, huge page and unauthorized query keys reject before any table disclosure",async()=>{
  for(const bad of [
   {from:"2099-12-31",to:"2099-01-01"},
   {page:10001},{pageSize:101},{secretUserId:OTHER},
  ])await expect(getTpoAuditLog(context,bad)).rejects.toBeDefined();
  expect(mock.scope).not.toHaveBeenCalled();
  expect(mock.actor).not.toHaveBeenCalled();
  expect(mock.table).not.toHaveBeenCalled();
  expect(tpoAuditQuerySchema.safeParse({kind:"SHARE",pageSize:25}).success).toBe(true);
 });
 it("returns honest unavailable SHARE category instead of inventing missing CRM history",async()=>{
  const result=await getTpoAuditLog(context,{kind:"SHARE",page:2});
  expect(result.items).toEqual([]);
  expect(result.unavailableSources).toContain("SHARE");
  expect(result.query.page).toBe(2);
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.actor).toHaveBeenCalledTimes(1);
 });
 it("the route-page actor gate runs before parsing or dispatching private audit queries",()=>{
  const src=readFileSync(new URL("../../src/app/(authenticated)/tpo/audit/page.tsx",import.meta.url),"utf8");
  const gate=src.indexOf("await requireTpoBatchActor(context);");
  expect(gate).toBeGreaterThan(0);
  expect(gate).toBeLessThan(src.indexOf("const params = await searchParams;"));
  expect(gate).toBeLessThan(src.indexOf("getTpoAuditLog("));
 });
});
