import {beforeEach,describe,expect,it,vi} from "vitest";
import {resolveTenantFromHost} from "@/modules/tenant-domains/service";
import {getPlatformHosts} from "@/modules/auth/config";
import {drizzleTenantDomainRepository} from "@/modules/tenant-domains/repository";
import {clearRequestTenantCacheForTests,resolveRequestTenant} from "@/modules/auth/request-tenant";

vi.mock("@/modules/tenant-domains/service",()=>({resolveTenantFromHost:vi.fn()}));
vi.mock("@/modules/tenant-domains/repository",()=>({drizzleTenantDomainRepository:{listByCollege:vi.fn()}}));
vi.mock("@/modules/auth/config",()=>({getPlatformHosts:vi.fn()}));

const look=vi.mocked(resolveTenantFromHost);
const listByCollege=vi.mocked(drizzleTenantDomainRepository.listByCollege);
describe("AUTH-tenant-binding-02 resolve host cache and outage fallback",()=>{
 beforeEach(()=>{vi.resetAllMocks();clearRequestTenantCacheForTests();
   vi.mocked(getPlatformHosts).mockReturnValue(new Set(["platform.example.test"]));
   listByCollege.mockResolvedValue([]);
 });
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
 it("never caches a verified college across authorization requests",async()=>{
  look.mockResolvedValueOnce({domainId:"d1",host:"college.test",collegeId:"A",organizationId:"OA"} as never)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({domainId:"d2",host:"college.test",collegeId:"B",organizationId:"OB"} as never);
  await expect(resolveRequestTenant("college.test")).resolves.toMatchObject({kind:"college",collegeId:"A"});
  // A different process may revoke the host: cached college A is not authority.
  await expect(resolveRequestTenant("college.test")).resolves.toEqual({kind:"unknown",host:"college.test"});
  expect(look).toHaveBeenCalledTimes(2);
  // A newly verified/reassigned host must also be fetched from SQL, not stale cache.
  clearRequestTenantCacheForTests();
  await expect(resolveRequestTenant("college.test")).resolves.toMatchObject({kind:"college",collegeId:"B"});
  expect(look).toHaveBeenCalledTimes(3);
 });
 it("AUTH-tenant-host-20 rejects invalid hostnames as unknown, without resolving domains or claiming DB outage",async()=>{
  for(const bad of ["bad..campus.test","bad/campus.test","user@campus.test","campus.test?x=y","-wrong.campus.test"]){
    await expect(resolveRequestTenant(bad)).resolves.toEqual({kind:"unknown",host:bad});
  }
  expect(look).not.toHaveBeenCalled();
 });
 it("distinguishes localhost, platform apex, platform www and verified tenant domains",async()=>{
  vi.mocked(getPlatformHosts).mockReturnValue(new Set([
    "localhost","42lms.example.test","www.42lms.example.test",
  ]));
  for(const input of ["localhost:3000","42lms.example.test","www.42lms.example.test"]){
   await expect(resolveRequestTenant(input)).resolves.toMatchObject({kind:"platform"});
  }
  expect(look).not.toHaveBeenCalled();
  look.mockImplementation(async host=>host==="verified.college.example.test"?{
    domainId:"verified",host,collegeId:"college-A",organizationId:"org-A",
  } as never:null);
  await expect(resolveRequestTenant("VERIFIED.COLLEGE.EXAMPLE.TEST:443")).resolves.toMatchObject({
   kind:"college",host:"verified.college.example.test",collegeId:"college-A",
  });
  await expect(resolveRequestTenant("www.verified.college.example.test")).resolves.toEqual({
   kind:"unknown",host:"www.verified.college.example.test",
  });
  expect(look).toHaveBeenCalledWith("verified.college.example.test",expect.anything());
  expect(look).toHaveBeenCalledWith("www.verified.college.example.test",expect.anything());
 });

 it("only redirects verified aliases to a verified primary in the same college and organization",async()=>{
  look.mockResolvedValue({
   domainId:"alias",host:"alias.example.test",collegeId:"college-A",organizationId:"org-A",
  } as never);
  listByCollege.mockResolvedValueOnce([
   {host:"foreign.example.test",collegeId:"college-B",organizationId:"org-B",isPrimary:true,isVerified:true},
   {host:"unverified.example.test",collegeId:"college-A",organizationId:"org-A",isPrimary:true,isVerified:false},
   {host:"primary.example.test",collegeId:"college-A",organizationId:"org-A",isPrimary:true,isVerified:true},
  ] as never);
  await expect(resolveRequestTenant("alias.example.test")).resolves.toMatchObject({
   kind:"college",collegeId:"college-A",canonicalHost:"primary.example.test",
   shouldRedirectToCanonicalHost:true,
  });
  clearRequestTenantCacheForTests();
  listByCollege.mockResolvedValueOnce([
   {host:"foreign.example.test",collegeId:"college-B",organizationId:"org-B",isPrimary:true,isVerified:true},
  ] as never);
  await expect(resolveRequestTenant("alias.example.test")).resolves.toEqual({
   kind:"college",host:"alias.example.test",collegeId:"college-A",organizationId:"org-A",
  });
 });
 it("never turns blank/unverified host into a usable college",async()=>{
  await expect(resolveRequestTenant("")).resolves.toEqual({kind:"unknown",host:""});
  look.mockResolvedValueOnce(null);
  await expect(resolveRequestTenant("unverified.test")).resolves.toEqual({kind:"unknown",host:"unverified.test"});
  expect(look).toHaveBeenCalledWith("unverified.test",expect.anything());
 });
});