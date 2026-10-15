import {describe,it,expect} from "vitest";
import {findPossibleCompanyDuplicates} from "@/modules/placements/company-curation-candidates-model";
describe("Super Admin company curation candidates",()=>{
 it("shows only distinct company IDs from the same already-scoped list",()=>{
 const rows=[
 {companyId:"company-1",name:"Acme",website:"https://www.acme.example/careers"},
 {companyId:"company-1",name:"Acme",website:"https://acme.example"},
 {companyId:"company-2",name:"Acme Talent",website:"https://acme.example/jobs"},
 {companyId:"company-3",name:"Other",website:null},
 ];
 expect(findPossibleCompanyDuplicates(rows)).toEqual([{domain:"acme.example",companies:[{id:"company-1",name:"Acme"},{id:"company-2",name:"Acme Talent"}]}]);
 });
 it("does not suggest merges from untrusted or missing websites",()=>{
 expect(findPossibleCompanyDuplicates([{companyId:"1",name:"One",website:"mailto:x@y.com"},{companyId:"2",name:"Two",website:null}])).toEqual([]);
 });
});
