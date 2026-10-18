import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 scope:vi.fn(),actor:vi.fn(),companies:vi.fn(),ready:vi.fn(),getDb:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mocks.actor}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/modules/placements/company-service",()=>({listPlacementCompanies:mocks.companies}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mocks.ready}));
import {
 getTpoCompaniesView,getTpoCompanyDetailView,exportTpoCompanyDirectory,
} from "@/modules/placements/tpo-companies-view-service";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"company-view-user",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:A,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
describe("TPO-BREAK-company-service-08 scoped company directory reads and redaction",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.scope.mockImplementation(async(_context:RequestContext,collegeId:string)=>{
   if(collegeId!==A)throw new Error("PERMISSION_DENIED");
   return {id:A,organizationId:ORG};
  });
  mocks.actor.mockResolvedValue(A);
  mocks.companies.mockResolvedValue([]);
  mocks.ready.mockResolvedValue(false);
  mocks.getDb.mockReturnValue({});
 });
 it("denies foreign college and does not probe optional CRM tables or any records",async()=>{
  for(const run of [
   ()=>getTpoCompaniesView(ctx,{collegeId:B}),
   ()=>getTpoCompanyDetailView(ctx,{collegeId:B,companyId:A}),
   ()=>exportTpoCompanyDirectory(ctx,{collegeId:B}),
  ]){
   await expect(run()).rejects.toThrow("PERMISSION_DENIED");
  }
  expect(mocks.companies).not.toHaveBeenCalled();
  expect(mocks.ready).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("honors strict parsing before looking up any college or recruiter contact",async()=>{
  for(const bad of [
   {collegeId:"../foreign"},{collegeId:A,anotherCollege:B},
   {collegeId:A,page:0},{collegeId:A,pageSize:1000},
  ]){
   await expect(getTpoCompaniesView(ctx,bad)).rejects.toBeDefined();
  }
  await expect(getTpoCompanyDetailView(ctx,{collegeId:A,companyId:"bad"}))
   .rejects.toBeDefined();
  expect(mocks.scope).not.toHaveBeenCalled();
 });
 it("returns a valid bounded empty directory rather than inventing CRM counts",async()=>{
  const result=await getTpoCompaniesView(ctx,{collegeId:A});
  expect(result.collegeId).toBe(A);
  expect(result.contactsAvailable).toBe(false);
  expect(result.totalCompanies).toBe(0);
  expect(result.canonicalCompanies).toBe(0);
  expect(result.unlinkedLeadGroups).toBe(0);
  expect(result.page).toMatchObject({page:1,pageSize:25,total:0,items:[]});
  expect(mocks.companies).toHaveBeenCalledWith(ctx,A);
  expect(mocks.ready).toHaveBeenCalledWith("placement_tpo_leads");
 });
 it("TPO-BREAK-company-read-actor-03 rejects a revoked or wrong-college persisted actor before CRM reads",async()=>{
  for(const live of [Promise.reject(new Error("ROLE_REVOKED")),Promise.resolve(B)]){
   mocks.actor.mockImplementationOnce(()=>live);
   await expect(getTpoCompaniesView(ctx,{collegeId:A})).rejects.toBeDefined();
  }
  expect(mocks.companies).not.toHaveBeenCalled();
  expect(mocks.ready).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("a missing company ID is indistinguishable from a foreign company and has no timeline",async()=>{
  await expect(getTpoCompanyDetailView(ctx,{collegeId:A,companyId:B}))
   .resolves.toBeNull();
 });
 it("empty authorized exports never include unrelated employer relationships",async()=>{
  await expect(exportTpoCompanyDirectory(ctx,{collegeId:A,search:"absent"}))
   .resolves.toEqual([]);
 });
});
