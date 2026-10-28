import {beforeEach,describe,expect,it,vi} from "vitest";
import {resolveTenantFromHost} from "@/modules/tenant-domains/service";
import {getPlatformHosts} from "@/modules/auth/config";
import {clearRequestTenantCacheForTests,resolveRequestTenant} from "@/modules/auth/request-tenant";
vi.mock("@/modules/tenant-domains/service",()=>({resolveTenantFromHost:vi.fn()}));
vi.mock("@/modules/tenant-domains/repository",()=>({drizzleTenantDomainRepository:{}}));
vi.mock("@/modules/auth/config",()=>({getPlatformHosts:vi.fn()}));
const lookup=vi.mocked(resolveTenantFromHost);
beforeEach(()=>{
 vi.resetAllMocks();
 clearRequestTenantCacheForTests();
 vi.mocked(getPlatformHosts).mockReturnValue(new Set(["platform.example.test"]));
});
describe("AUTH-tenant-cache-15 bounded tenant-domain resolution",()=>{
 it("bounds negative-host caching without storing verified colleges",async()=>{
  lookup.mockImplementation(async host=>{
   if(host==="north.example.test"||host==="south.example.test")return {
     domainId:host,host,collegeId:host==="north.example.test"?"north":"south",organizationId:"org",
   } as never;
   return null;
  });
  for(let i=0;i<498;i++){
   await resolveRequestTenant("unknown-"+i+".example.test");
  }
  await expect(resolveRequestTenant("north.example.test")).resolves.toMatchObject({
   kind:"college",collegeId:"north",
  });
  await expect(resolveRequestTenant("south.example.test")).resolves.toMatchObject({
   kind:"college",collegeId:"south",
  });
  const before=lookup.mock.calls.length;
  await expect(resolveRequestTenant("extra.example.test")).resolves.toMatchObject({kind:"unknown"});
  expect(lookup).toHaveBeenCalledTimes(before+1);
  const after=lookup.mock.calls.length;
  await expect(resolveRequestTenant("north.example.test")).resolves.toMatchObject({kind:"college",collegeId:"north"});
  await expect(resolveRequestTenant("south.example.test")).resolves.toMatchObject({kind:"college",collegeId:"south"});
  expect(lookup).toHaveBeenCalledTimes(after+2);
 });
 it("sustained 600-host negative-cache flood cannot bypass fresh verification",async()=>{
  lookup.mockImplementation(async host=>host==="early.example.test"?{
   domainId:"early",host,collegeId:"early",organizationId:"org",
  } as never:null);
  await expect(resolveRequestTenant("early.example.test")).resolves.toMatchObject({kind:"college",collegeId:"early"});
  for(let i=0;i<620;i++)await resolveRequestTenant("attacker-"+i+".example.test");
  const reads=lookup.mock.calls.length;
  await expect(resolveRequestTenant("early.example.test")).resolves.toMatchObject({kind:"college",collegeId:"early"});
  expect(lookup).toHaveBeenCalledTimes(reads+1);
 });
 it("retains fail-closed unknown and unavailable outcomes independently of cache pressure",async()=>{
  lookup.mockRejectedValueOnce(new Error("tenant DB temporarily down"));
  await expect(resolveRequestTenant("secure.example.test")).resolves.toMatchObject({kind:"unavailable"});
  lookup.mockResolvedValueOnce(null);
  await expect(resolveRequestTenant("secure.example.test")).resolves.toMatchObject({kind:"unknown"});
 });
});
