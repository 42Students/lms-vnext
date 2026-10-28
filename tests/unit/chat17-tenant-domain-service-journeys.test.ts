import { describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import {
  createTenantDomain, deleteTenantDomain, listTenantDomains, resolveTenantFromHost,
  setPrimaryTenantDomain, verifyTenantDomain,
  type TenantDomainRepository, type TenantDomainView, type TenantDomainVerifier,
} from "@/modules/tenant-domains/service";

const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const ORG="33333333-3333-4333-8333-333333333333";
const DOMAIN="44444444-4444-4444-8444-444444444444";
const HOST="portal.example.edu";
const asSuperAdmin=(scope?:string,disabled=false):RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"test-superadmin",
    platformStatus:disabled?"DISABLED":"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:scope?{collegeId:scope,organizationId:ORG}:null,
});
const asCollegeAdmin=():RequestContext=>({
  user:{id:"66666666-6666-4666-8666-666666666666",identityUid:"test-college",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"77777777-7777-4777-8777-777777777777",collegeId:OWNER,
    organizationId:ORG,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
});
const domain=(props:Partial<TenantDomainView>={}):TenantDomainView=>({
  id:DOMAIN,collegeId:OWNER,organizationId:ORG,host:HOST,
  isPrimary:false,isVerified:false,verificationToken:"opaque-proof",
  verifiedAt:null,lastCheckedAt:null,lastCheckResult:null,
  createdAt:new Date("2026-10-01T00:00:00Z"),
  updatedAt:new Date("2026-10-01T00:00:00Z"),...props,
});
function makeRepo(){
  const stored=domain();
  return {
    loadActiveCollege:vi.fn(async()=>({id:OWNER,organizationId:ORG})),
    listByCollege:vi.fn(async()=>[stored]),
    loadDomain:vi.fn(async()=>stored),
    findByHost:vi.fn(async()=>null as TenantDomainView|null),
    createDomain:vi.fn(async(input:Parameters<TenantDomainRepository["createDomain"]>[0])=>
      domain({collegeId:input.collegeId,host:input.host,verificationToken:input.verificationToken})),
    recordVerificationResult:vi.fn(async(_id:string,input:Parameters<TenantDomainRepository["recordVerificationResult"]>[1])=>
      domain({isVerified:input.verified,lastCheckedAt:input.checkedAt,lastCheckResult:input.result})),
    setPrimary:vi.fn(async()=>domain({isPrimary:true,isVerified:true})),
    deleteDomain:vi.fn(async()=>{}),
    resolveVerifiedHost:vi.fn(async()=>({
      domainId:DOMAIN,collegeId:OWNER,organizationId:ORG,host:HOST,
    })),
  } satisfies TenantDomainRepository;
}
describe("WEAK-tenant-domains service authorization, idempotency and hostile host journeys",()=>{
  it("WEAK-tenant-domains-07 college admin cannot manage DNS proof even for own college",async()=>{
    const repo=makeRepo();
    await expect(listTenantDomains(asCollegeAdmin(),OWNER,repo)).rejects.toThrow();
    await expect(createTenantDomain(asCollegeAdmin(),{collegeId:OWNER,host:HOST},repo))
      .rejects.toThrow();
    await expect(setPrimaryTenantDomain(asCollegeAdmin(),DOMAIN,repo)).rejects.toThrow();
    expect(repo.createDomain).not.toHaveBeenCalled();
    expect(repo.setPrimary).not.toHaveBeenCalled();
  });

  it("WEAK-tenant-domains-08 acting SA scoped to another college cannot create or verify",async()=>{
    const repo=makeRepo();
    await expect(createTenantDomain(asSuperAdmin(OTHER),{collegeId:OWNER,host:HOST},repo))
      .rejects.toThrow();
    await expect(verifyTenantDomain(asSuperAdmin(OTHER),DOMAIN,repo,{
      verify:vi.fn(async()=>({verified:true as const,result:"VERIFIED" as const})),
    })).rejects.toThrow();
    expect(repo.createDomain).not.toHaveBeenCalled();
    expect(repo.recordVerificationResult).not.toHaveBeenCalled();
  });

  it("WEAK-tenant-domains-09 duplicate same-college host returns existing without a second token or write",async()=>{
    const repo=makeRepo();
    const existing=domain({isVerified:true});
    repo.findByHost.mockResolvedValueOnce(existing);
    const token=vi.fn(()=>"should-not-be-issued");
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:" PORTAL.Example.edu "},
      repo,token)).resolves.toEqual(existing);
    expect(repo.findByHost).toHaveBeenCalledWith(HOST);
    expect(repo.createDomain).not.toHaveBeenCalled();
    expect(token).not.toHaveBeenCalled();
  });

  it("WEAK-tenant-domains-10 another college claiming the same hostname is rejected before a write",async()=>{
    const repo=makeRepo();
    repo.findByHost.mockResolvedValueOnce(domain({collegeId:OTHER}));
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:HOST},repo))
      .rejects.toMatchObject({code:"HOST_CONFLICT"});
    expect(repo.createDomain).not.toHaveBeenCalled();
  });

  it("WEAK-tenant-domains-17 parallel same-host create recovers uniqueness winner in own college",async()=>{
    const repo=makeRepo();
    const winner=domain({verificationToken:"winner-token"});
    repo.findByHost.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    repo.createDomain.mockRejectedValueOnce(Object.assign(new Error("unique host"),{code:"23505"}));
    const freshToken=vi.fn(()=>"loser-token");
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:HOST},repo,freshToken))
      .resolves.toEqual(winner);
    expect(repo.findByHost).toHaveBeenCalledTimes(2);
    expect(repo.createDomain).toHaveBeenCalledOnce();
    expect(freshToken).toHaveBeenCalledOnce();
  });

  it("WEAK-tenant-domains-18 unique race never returns another college's host or raw SQLSTATE",async()=>{
    const repo=makeRepo();
    repo.findByHost.mockResolvedValueOnce(null).mockResolvedValueOnce(domain({collegeId:OTHER}));
    repo.createDomain.mockRejectedValueOnce(Object.assign(new Error("23505 raw"),{code:"23505"}));
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:HOST},repo))
      .rejects.toMatchObject({code:"HOST_CONFLICT"});
    expect(repo.createDomain).toHaveBeenCalledOnce();
  });

  it("WEAK-tenant-domains-19 non-unique storage failures are not disguised as domain conflicts",async()=>{
    const repo=makeRepo();
    repo.createDomain.mockRejectedValueOnce(Object.assign(new Error("database timeout"),{code:"57014"}));
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:HOST},repo))
      .rejects.toMatchObject({message:"database timeout",code:"57014"});
    expect(repo.findByHost).toHaveBeenCalledOnce();
  });

  it("WEAK-tenant-domains-27 nested Drizzle causes recover only true 23505 races",async()=>{
    const repo=makeRepo();
    const existing=domain({verificationToken:"first-writer"});
    repo.findByHost.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const sql=Object.assign(new Error("driver duplicate"),{code:"23505"});
    const wrapped=new Error("DrizzleQueryError",{
      cause:new Error("database adapter", {cause:sql}),
    });
    repo.createDomain.mockRejectedValueOnce(wrapped);
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:HOST},repo))
      .resolves.toEqual(existing);
    expect(repo.findByHost).toHaveBeenCalledTimes(2);

    const separate=makeRepo();
    const cycle:{code?:string;cause?:unknown}={code:"not-duplicate"};
    cycle.cause=cycle;
    separate.createDomain.mockRejectedValueOnce(cycle);
    await expect(createTenantDomain(asSuperAdmin(),{collegeId:OWNER,host:HOST},separate))
      .rejects.toBe(cycle);
    expect(separate.findByHost).toHaveBeenCalledOnce();
  });

  it("WEAK-tenant-domains-11 proof failure is recorded, not misreported as verified",async()=>{
    const repo=makeRepo();
    const verify=vi.fn(async()=>({verified:false as const,result:"TXT_RECORD_MISSING" as const}));
    const result=await verifyTenantDomain(asSuperAdmin(),DOMAIN,repo,{verify} satisfies TenantDomainVerifier);
    expect(verify).toHaveBeenCalledWith(HOST,"opaque-proof");
    expect(repo.recordVerificationResult).toHaveBeenCalledOnce();
    expect(result.isVerified).toBe(false);
    expect(result.lastCheckResult).toBe("TXT_RECORD_MISSING");
  });

  it("WEAK-tenant-domains-12 verified host is idempotent without a pending recheck; missing token fails closed",async()=>{
    const repo=makeRepo();
    repo.loadDomain.mockResolvedValueOnce(domain({isVerified:true,verificationToken:null}));
    const verify=vi.fn(async()=>({verified:true as const,result:"VERIFIED" as const}));
    await expect(verifyTenantDomain(asSuperAdmin(),DOMAIN,repo,{verify})).resolves.toMatchObject({isVerified:true});
    expect(verify).not.toHaveBeenCalled();
    repo.recordVerificationResult.mockClear();
    repo.loadDomain.mockResolvedValueOnce(domain({verificationToken:null}));
    await expect(verifyTenantDomain(asSuperAdmin(),DOMAIN,repo,{verify}))
      .rejects.toMatchObject({code:"DOMAIN_NOT_VERIFIED"});
    expect(repo.recordVerificationResult).not.toHaveBeenCalled();
  });

  it("WEAK-tenant-domains-12b explicitly issued verified-host recheck must query DNS",async()=>{
    const repo=makeRepo();
    repo.loadDomain.mockResolvedValueOnce(domain({isVerified:true,verificationToken:"opaque-proof"}));
    const verify=vi.fn(async()=>({verified:true as const,result:"VERIFIED" as const}));
    await expect(verifyTenantDomain(asSuperAdmin(),DOMAIN,repo,{verify}))
      .resolves.toMatchObject({isVerified:true});
    expect(verify).toHaveBeenCalledExactlyOnceWith(HOST,"opaque-proof");
    expect(repo.recordVerificationResult).toHaveBeenCalledOnce();
  });

  it("WEAK-tenant-domains-13 unverified host cannot become primary",async()=>{
    const repo=makeRepo();
    await expect(setPrimaryTenantDomain(asSuperAdmin(),DOMAIN,repo))
      .rejects.toMatchObject({code:"DOMAIN_NOT_VERIFIED"});
    expect(repo.setPrimary).not.toHaveBeenCalled();
    repo.loadDomain.mockResolvedValueOnce(domain({isVerified:true}));
    await expect(setPrimaryTenantDomain(asSuperAdmin(),DOMAIN,repo)).resolves.toMatchObject({isPrimary:true});
    expect(repo.setPrimary).toHaveBeenCalledWith(DOMAIN,asSuperAdmin());
  });

  it("WEAK-tenant-domains-14 primary-domain deletion requires exact confirmed name",async()=>{
    const repo=makeRepo();
    repo.loadDomain.mockResolvedValue(domain({isPrimary:true,isVerified:true}));
    await expect(deleteTenantDomain(asSuperAdmin(),DOMAIN,repo)).rejects.toMatchObject({
      code:"PRIMARY_HOST_CONFIRMATION_REQUIRED",
    });
    await expect(deleteTenantDomain(asSuperAdmin(),DOMAIN,repo,"other.example.edu"))
      .rejects.toMatchObject({code:"PRIMARY_HOST_CONFIRMATION_REQUIRED"});
    expect(repo.deleteDomain).not.toHaveBeenCalled();
    await deleteTenantDomain(asSuperAdmin(),DOMAIN,repo,HOST);
    expect(repo.deleteDomain).toHaveBeenCalledWith(DOMAIN,HOST,asSuperAdmin());
  });

  it("WEAK-tenant-domains-15 resolves only canonical request-host and rejects spoofed backslashes",async()=>{
    const repo=makeRepo();
    await expect(resolveTenantFromHost("PORTAL.Example.edu:443",repo))
      .resolves.toMatchObject({collegeId:OWNER,host:HOST});
    expect(repo.resolveVerifiedHost).toHaveBeenCalledWith(HOST);
    await expect(resolveTenantFromHost("portal.example.edu\\attacker.test",repo)).rejects.toThrow();
    expect(repo.resolveVerifiedHost).toHaveBeenCalledTimes(1);
  });

  it("WEAK-tenant-domains-16 disabled Super Admin cannot list or delete a domain",async()=>{
    const repo=makeRepo();
    await expect(listTenantDomains(asSuperAdmin(undefined,true),OWNER,repo)).rejects.toThrow();
    await expect(deleteTenantDomain(asSuperAdmin(undefined,true),DOMAIN,repo)).rejects.toThrow();
    expect(repo.listByCollege).not.toHaveBeenCalled();
    expect(repo.deleteDomain).not.toHaveBeenCalled();
  });
});
