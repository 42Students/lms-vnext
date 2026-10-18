import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const m=vi.hoisted(()=>({actor:vi.fn(),scope:vi.fn(),db:vi.fn(),companies:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:m.actor,
}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:m.scope}));
vi.mock("@/db/client",()=>({getDb:m.db}));
vi.mock("@/modules/placements/company-service",()=>({listPlacementCompanies:m.companies}));
import {getTpoCompaniesView,getTpoCompanyDetailView,exportTpoCompanyDirectory}
 from "@/modules/placements/tpo-companies-view-service";
import {getTpoCompanyLifecycle,listArchivedTpoCompanyRelationships}
 from "@/modules/placements/tpo-company-lifecycle-service";
import {getTpoCompanyDetailReadOnly}
 from "@/modules/placements/tpo-company-detail-read-service";
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FOREIGN="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"company-read",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  status:"ACTIVE",roles:["TPO"]},
};
const readAll=async()=>{
 await getTpoCompaniesView(ctx,{collegeId:COLLEGE});
 await getTpoCompanyDetailView(ctx,{collegeId:COLLEGE,companyId:COMPANY});
 await exportTpoCompanyDirectory(ctx,{collegeId:COLLEGE});
 await getTpoCompanyLifecycle(ctx,COMPANY);
 await listArchivedTpoCompanyRelationships(ctx);
 await getTpoCompanyDetailReadOnly(ctx,COMPANY);
};
describe("TPO-companies-read-revocation-02 all private company reads fail before scope queries",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  m.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
 });
 it("revoked officers cannot enumerate companies, archived relationships, hiring or recruiter contacts",async()=>{
  // Every independent service entrypoint must refuse access before even
  // checking whether the company/college record exists.
  for(const query of [
   ()=>getTpoCompaniesView(ctx,{collegeId:COLLEGE}),
   ()=>getTpoCompanyDetailView(ctx,{collegeId:COLLEGE,companyId:COMPANY}),
   ()=>exportTpoCompanyDirectory(ctx,{collegeId:COLLEGE}),
   ()=>getTpoCompanyLifecycle(ctx,COMPANY),
   ()=>listArchivedTpoCompanyRelationships(ctx),
   ()=>getTpoCompanyDetailReadOnly(ctx,COMPANY),
  ])await expect(query()).rejects.toBeInstanceOf(AuthorizationError);
  expect(m.scope).not.toHaveBeenCalled();
  expect(m.companies).not.toHaveBeenCalled();
  expect(m.db).not.toHaveBeenCalled();
 });
 it("a newly active officer at another college cannot read a stale old college",async()=>{
  m.actor.mockResolvedValue(FOREIGN);
  await expect(getTpoCompaniesView(ctx,{collegeId:COLLEGE})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoCompanyLifecycle(ctx,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoCompanyDetailReadOnly(ctx,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  expect(m.scope).not.toHaveBeenCalled();
  expect(m.db).not.toHaveBeenCalled();
 });
 it("does not accept malformed company identity as proof of access",async()=>{
  await expect(getTpoCompanyDetailReadOnly(ctx,"../other-college")).rejects.toBeDefined();
  await expect(getTpoCompanyLifecycle(ctx,"../other-college")).rejects.toBeDefined();
  expect(m.db).not.toHaveBeenCalled();
 });
});
