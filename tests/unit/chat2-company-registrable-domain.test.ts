import {describe,expect,it} from "vitest";
import {registrableWorkDomain,matchesCompanyDomain} from "@/modules/placements/public-join/domain-model";
describe("TPO-campaigns-public-R07 matching domain and subdomains",()=>{
 it("maps a subdomain mailbox to the company registrable domain",()=>{
  expect(registrableWorkDomain("ravi@mail.acme.com")).toBe("acme.com");
  expect(registrableWorkDomain("ravi@eu.acme.co.in")).toBe("acme.co.in");
  expect(registrableWorkDomain("ravi@dept.example.co.uk")).toBe("example.co.uk");
 });
 it("requires a real company suffix boundary",()=>{
  expect(matchesCompanyDomain("ravi@eu.acme.com","acme.com")).toBe(true);
  expect(matchesCompanyDomain("ravi@notacme.com","acme.com")).toBe(false);
  expect(matchesCompanyDomain("ravi@acme.com.attacker.com","acme.com")).toBe(false);
  expect(matchesCompanyDomain("ravi@gmail.com","gmail.com")).toBe(false);
 });
});
