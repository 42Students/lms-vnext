import {beforeEach,describe,expect,it,vi} from "vitest";
import {resolveTenantFromHost} from "@/modules/tenant-domains/service";
import {getPlatformHosts} from "@/modules/auth/config";
import {clearRequestTenantCacheForTests,resolveRequestTenant} from "@/modules/auth/request-tenant";

vi.mock("@/modules/tenant-domains/service",()=>({resolveTenantFromHost:vi.fn()}));
vi.mock("@/modules/tenant-domains/repository",()=>({drizzleTenantDomainRepository:{}}));
vi.mock("@/modules/auth/config",()=>({getPlatformHosts:vi.fn()}));

const look=vi.mocked(resolveTenantFromHost);
describe("AUTH-tenant-binding-02 resolve host cache and outage fallback",()=>{
 beforeEach(()=>{vi.resetAllMocks();clearRequestTenantCacheForTests();
   vi.mocked(getPlatformHosts).mockReturnValue(new Set(["platform.example.test"]));});
 it("returns a known platform host without reading any tenant-domain records",async()=>{
  await expect(resolveRequestTenant(" PLATform.example.test:443 ")).resolves.toEqual({
    kind:"platform",host:"platform.example.test",
  });
  expect(look).not.toHaveBeenCalled();
 });
 it("AUTH-tenant-binding-02 treats database outages as unavailable and never caches false unknown",async()=>{
  look.mockRejectedValueOnce(new Error("transient database failure")).mockResolvedValueOnce({
    domainId:"domain-a",host:"college.example.test",
    collegeId:"college-A",organizationId:"org-A",
  } as never);
  await expect(resolveRequestTenant("college.example.test")).resolves.toEqual({
    kind:"unavailable",host:"college.example.test",
  });
  expect(look).toHaveBeenCalledTimes(1);
  await expect(resolveRequestTenant("college.example.test")).resolves.toEqual({
    kind:"college",host:"college.example.test",collegeId:"college-A",organizationId:"org-A",
  });
  expect(look).toHaveBeenCalledTimes(2);
 });
 it("caches a verified college for the TTL but re-checks after cache reset",async()=>{
  look.mockResolvedValueOnce({domainId:"d1",host:"college.test",collegeId:"A",organizationId:"OA"} as never)
    .mockResolvedValueOnce({domainId:"d2",host:"college.test",collegeId:"B",organizationId:"OB"} as never);
  const first=await resolveRequestTenant("college.test");
  expect(first).toMatchObject({kind:"college",collegeId:"A"});
  await expect(resolveRequestTenant("college.test")).resolves.toEqual(first);
  expect(look).toHaveBeenCalledTimes(1);
  clearRequestTenantCacheForTests();
  await expect(resolveRequestTenant("college.test")).resolves.toMatchObject({kind:"college",collegeId:"B"});
  expect(look).toHaveBeenCalledTimes(2);
 });
 it("AUTH-tenant-host-20 rejects invalid hostnames as unknown, without resolving domains or claiming DB outage",async()=>{
  for(const bad of ["bad..campus.test","bad/campus.test","user@campus.test","campus.test?x=y","-wrong.campus.test"]){
    await expect(resolveRequestTenant(bad)).resolves.toEqual({kind:"unknown",host:bad});
  }
  expect(look).not.toHaveBeenCalled();
 });
 it("never turns blank/unverified host into a usable college",async()=>{
  await expect(resolveRequestTenant("")).resolves.toEqual({kind:"unknown",host:""});
  look.mockResolvedValueOnce(null);
  await expect(resolveRequestTenant("unverified.test")).resolves.toEqual({kind:"unknown",host:"unverified.test"});
  expect(look).toHaveBeenCalledWith("unverified.test",expect.anything());
 });
});