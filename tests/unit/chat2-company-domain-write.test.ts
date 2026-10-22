import {describe,it,expect} from "vitest";
import {addCompanyDomainSchema} from "@/modules/placements/tpo-company-domain-service";
describe("TPO-companies-02 domain update contract",()=>{
 it("requires a bare verified-looking domain and target ID",()=>{
  const companyId="fdb3f617-1e4a-4d9e-9b36-a9c0c43fd457";
  expect(addCompanyDomainSchema.safeParse({companyId,domain:"acme.co.in"}).success).toBe(true);
  expect(addCompanyDomainSchema.safeParse({companyId,domain:"https://acme.com"})).toMatchObject({success:true,data:{companyId,domain:"acme.com"}});
  expect(addCompanyDomainSchema.safeParse({companyId,domain:"https://user:pw@acme.com"}).success).toBe(false);
  expect(addCompanyDomainSchema.safeParse({companyId,domain:"acme.com",collegeId:companyId}).success).toBe(false);
 });
});
