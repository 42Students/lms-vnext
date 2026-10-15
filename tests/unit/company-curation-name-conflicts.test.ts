import {describe,it,expect} from "vitest";
import {findCompanyNameIdentityConflicts} from "@/modules/placements/company-curation-name-conflicts";
describe("same-name employer identity review",()=>{
 it("deduplicates repeated relationships but warns on distinct IDs",()=>{
 expect(findCompanyNameIdentityConflicts([
  {companyId:"a",name:"Acme   India"},{companyId:"a",name:"ACME INDIA"},
  {companyId:"b",name:"acme india"},{companyId:"c",name:"Other"},
 ])).toEqual([{key:"acme india",label:"Acme   India",companyIds:["a","b"]}]);
 });
 it("never reports a single employer spread across colleges as a duplicate",()=>{
 expect(findCompanyNameIdentityConflicts([{companyId:"a",name:"Acme"},{companyId:"a",name:"Acme"}])).toEqual([]);
 });
});
