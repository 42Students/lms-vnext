import { beforeEach, describe, expect, it, vi } from "vitest";
import { dnsTenantDomainVerifier } from "@/modules/tenant-domains/dns-verifier";
import { verificationDnsName, verificationDnsValue } from "@/modules/tenant-domains/service";

const dns=vi.hoisted(()=>({resolveTxt:vi.fn(),setServers:vi.fn()}));
vi.mock("node:dns/promises",()=>({
 Resolver:class {
  resolveTxt=dns.resolveTxt;
  setServers=dns.setServers;
 },
}));
const txt=dns.resolveTxt;
const hostname="college.example.edu";
const token="test-ownership-opaque-token";

describe("WEAK-tenant-domains: DNS proof never treats lookup failure as ownership",()=>{
 beforeEach(()=>{vi.resetAllMocks();txt.mockResolvedValue([]);});
 it("WEAK-tenant-domains-01 splits TXT chunks then requires entire exact verification value",async()=>{
  txt.mockResolvedValueOnce([["other-dns-value"],["lms-vnext-","verification="+token]]);
  expect(await dnsTenantDomainVerifier.verify(hostname,token)).toEqual({
   verified:true,result:"VERIFIED",
  });
  expect(txt).toHaveBeenCalledWith(verificationDnsName(hostname));
  expect(verificationDnsValue(token)).toBe("lms-vnext-verification="+token);
 });
 it("WEAK-tenant-domains-02 rejects a complete but mismatched TXT value",async()=>{
  txt.mockResolvedValueOnce([["lms-vnext-verification="+token+"-wrong"]]);
  expect(await dnsTenantDomainVerifier.verify(hostname,token)).toEqual({
   verified:false,result:"TXT_VALUE_MISMATCH",
  });
 });
 it.each(["ENODATA","ENOTFOUND"])("WEAK-tenant-domains-03 %s missing DNS returns unverified without leaking system errors",async code=>{
  txt.mockRejectedValueOnce(Object.assign(new Error("resolver"),{code}));
  expect(await dnsTenantDomainVerifier.verify(hostname,token)).toEqual({
   verified:false,result:"TXT_RECORD_MISSING",
  });
 });
 it.each(["ETIMEOUT","EAI_AGAIN","SERVFAIL"])("WEAK-tenant-domains-04 %s resolver error fails closed",async code=>{
  txt.mockRejectedValueOnce(Object.assign(new Error("resolver"),{code}));
  expect(await dnsTenantDomainVerifier.verify(hostname,token)).toEqual({
   verified:false,result:"DNS_LOOKUP_FAILED",
  });
 });
 it("WEAK-tenant-domains-05 malformed thrown resolver objects fail closed, never verified",async()=>{
  txt.mockRejectedValueOnce("resolver unavailable");
  expect(await dnsTenantDomainVerifier.verify(hostname,token)).toEqual({
   verified:false,result:"DNS_LOOKUP_FAILED",
  });
 });
});
