import {describe,it,expect} from "vitest";
import {companyDomainFromWebsite,curateCompanyDomainSchema} from "@/modules/placements/company-curation-domain-model";
describe("company curation domains",()=>{
 it("normalizes website hosts without paths",()=>{expect(companyDomainFromWebsite("https://www.example.com/jobs")).toBe("example.com");expect(companyDomainFromWebsite("mailto:hello@example.com")).toBeNull();});
 it("rejects caller-supplied college scope",()=>{expect(curateCompanyDomainSchema.safeParse({companyId:"invalid",domain:"example.com",expectedVersion:1,collegeId:"foreign"}).success).toBe(false);});
});
