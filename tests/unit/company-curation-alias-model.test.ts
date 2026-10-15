import {describe,it,expect} from "vitest";
import {canonicalCompanyAlias,uniqueCompanyAliases,companyAliasInputSchema} from "@/modules/placements/company-curation-alias-model";
describe("company aliases",()=>{
 it("collapses equivalent aliases without deleting the original spelling",()=>{
 expect(uniqueCompanyAliases(["Acme Corp"," acme   corp ","ACME INDIA"])).toEqual(["Acme Corp","ACME INDIA"]);
 expect(canonicalCompanyAlias("  ACME  ")).toBe("acme");
 });
 it("rejects unknown cross-tenant inputs",()=>{
 expect(companyAliasInputSchema.safeParse({companyId:"not-uuid",alias:"A",expectedVersion:0,collegeId:"foreign"}).success).toBe(false);
 });
});