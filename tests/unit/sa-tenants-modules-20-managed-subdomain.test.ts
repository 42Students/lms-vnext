import {describe,it,expect} from "vitest";
import {managedBaseDomain,managedHost,isManagedHost,managedSubdomainRequest} from "@/modules/tenant-domains/managed-subdomain-model";
describe("SA-tenants-modules-20 guarded platform subdomain allotment",()=>{
 it("refuses automatic mapping unless wildcard deployment was explicitly confirmed",()=>{
  expect(managedBaseDomain("lms.example.org",false)).toBeNull();
  expect(managedBaseDomain(undefined,true)).toBeNull();
  expect(managedBaseDomain("lms.example.org",true)).toBe("lms.example.org");
 });
 it("rejects reserved, malformed or customer-controlled labels",()=>{
  expect(()=>managedHost("admin","lms.example.org")).toThrow();
  expect(()=>managedHost("abc.other.org","lms.example.org")).toThrow();
  expect(managedHost("my-college","lms.example.org")).toBe("my-college.lms.example.org");
  expect(isManagedHost("my-college.lms.example.org","lms.example.org")).toBe(true);
  expect(isManagedHost("foreign.example.org","lms.example.org")).toBe(false);
 });
 it("requires an expected previous host for safe change/remove",()=>{
  expect(managedSubdomainRequest.safeParse({action:"CHANGE",label:"new-name",expectedHost:"old-name.lms.example.org"}).success).toBe(true);
  expect(managedSubdomainRequest.safeParse({action:"REMOVE",label:"x",expectedHost:null}).success).toBe(false);
 });
});
