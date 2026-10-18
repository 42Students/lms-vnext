import { describe, expect, it } from "vitest";
import {
  managedBaseDomain, managedHost, isManagedHost, managedSubdomainRequest,
} from "@/modules/tenant-domains/managed-subdomain-model";
import {
  availableSubdomainLabel, subdomainMoveInputSchema,
} from "@/modules/tenant-domains/college-subdomain-model";
import {
  canConfirmPrimaryDomainDelete, describePrimaryDomainSwitch,
} from "@/modules/tenant-domains/admin-confirmation-model";

const COLLEGE="11111111-1111-4111-8111-111111111111";
describe("WEAK-tenant-managed-20..25 wildcard and primary domain integrity",()=>{
  it("WEAK-tenant-managed-20 managed wildcard requires verified TLS flag and canonical DNS suffix",()=>{
    expect(managedBaseDomain(undefined,true)).toBeNull();
    expect(managedBaseDomain("lms.example.edu",false)).toBeNull();
    expect(managedBaseDomain("LOCALHOST",true)).toBeNull();
    expect(managedBaseDomain("lms.example.edu",true)).toBe("lms.example.edu");
    expect(managedBaseDomain("LMS.Example.EDU.",true)).toBe("lms.example.edu");
    for(const raw of ["foo/bar.example.edu","foo.example.edu:443",
      "foo\\bar.example.edu","127.0.0.1","8.8.8.8","0.0.0.0",""]){
      expect(managedBaseDomain(raw,true)).toBeNull();
    }
  });

  it("WEAK-tenant-managed-21 reserved, short, hyphen-bound and unicode labels cannot be assigned",()=>{
    for(const label of ["admin","api","www","mail","auth","support","static",
      "a","ab","-start","ending-","has.dot","has/slash","école","abc_123"]){
      expect(availableSubdomainLabel(label)).toBe(false);
      expect(()=>managedHost(label,"lms.example.edu")).toThrow("SUBDOMAIN_RESERVED_OR_INVALID");
    }
    expect(availableSubdomainLabel("iit-dharwad")).toBe(true);
    expect(managedHost("IIT-DHARWAD","LMS.Example.EDU"))
      .toBe("iit-dharwad.lms.example.edu");
  });

  it("WEAK-tenant-managed-22 malformed request is refused before the stale host may be updated",()=>{
    for(const raw of [
      {action:"ALLOT",label:"admin",expectedHost:null},
      {action:"ALLOT",label:"iit-campus",expectedHost:null,force:true},
      {action:"CHANGE",expectedHost:"old.example.edu"},
      {action:"REMOVE",label:"iit-campus",expectedHost:"iit-campus.lms.example.edu"},
      {action:"NOPE",label:"iit-campus",expectedHost:null},
      {action:"ALLOT",label:"iit-campus",expectedHost:5},
    ]){
      expect(managedSubdomainRequest.safeParse(raw).success).toBe(false);
    }
    for(const good of [
      {action:"ALLOT",label:"iit-campus",expectedHost:null},
      {action:"CHANGE",label:"iit-campus",expectedHost:"old.lms.example.edu"},
      {action:"REMOVE",expectedHost:"old.lms.example.edu"},
    ])expect(managedSubdomainRequest.safeParse(good).success).toBe(true);
  });

  it("WEAK-tenant-managed-23 managed-host recognition requires one exact label and suffix",()=>{
    expect(isManagedHost("iit.lms.example.edu","lms.example.edu")).toBe(true);
    for(const host of ["lms.example.edu","evil-lms.example.edu",
      ".lms.example.edu","api.lms.example.edu","-bad.lms.example.edu",
      "CAPITAL.lms.example.edu",
      "iit.branch.lms.example.edu","iit.lms.example.edu.attacker.test",
      "iit.other.example.edu"]){
      expect(isManagedHost(host,"lms.example.edu")).toBe(false);
    }
  });

  it("WEAK-tenant-managed-24 stale version, invalid college and unknown keys fail schema validation",()=>{
    expect(subdomainMoveInputSchema.safeParse({
      collegeId:COLLEGE,label:"iit-campus",expectedVersion:0,
    }).success).toBe(true);
    for(const raw of [
      {collegeId:COLLEGE,label:"iit-campus",expectedVersion:-1},
      {collegeId:COLLEGE,label:"iit-campus",expectedVersion:1.5},
      {collegeId:"invalid",label:"iit-campus",expectedVersion:0},
      {collegeId:COLLEGE,label:"api",expectedVersion:0,force:true},
    ])expect(subdomainMoveInputSchema.safeParse(raw).success).toBe(false);
  });

  it("WEAK-tenant-managed-25 primary delete requires exact operator spelling and switch explains DNS consequences",()=>{
    expect(canConfirmPrimaryDomainDelete("portal.example.edu","portal.example.edu")).toBe(true);
    for(const typed of ["portal.example.edu ","PORTAL.example.edu","https://portal.example.edu",""]){
      expect(canConfirmPrimaryDomainDelete("portal.example.edu",typed)).toBe(false);
    }
    expect(describePrimaryDomainSwitch("a.example.edu","a.example.edu")).toContain("No change");
    const changed=describePrimaryDomainSwitch("a.example.edu","b.example.edu");
    expect(changed).toContain("bookmarks");
    expect(changed).toContain("Existing DNS records are not edited");
  });
});
