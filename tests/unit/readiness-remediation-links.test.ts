import {describe,it,expect} from "vitest";
import {readinessRemediationLink} from "@/modules/colleges/readiness-remediation-links";
describe("Super Admin readiness remediation links",()=>{
 it("links a verified primary-domain failure to its selected tenant",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(readinessRemediationLink("TENANT_DOMAIN",id)).toBe("/admin/colleges/"+id+"/subdomain");
 expect(readinessRemediationLink("FACULTY",id)).toBe("/admin/faculty");
 expect(readinessRemediationLink("COHORTS",id)).toBe("/admin/batches");
 });
});
