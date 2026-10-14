import { describe, it, expect } from "vitest";
import { buildTpoCompanyReportLinks } from "@/modules/placements/tpo-company-report-links-model";
const id = (n: number) => "aaaaaaaa-aaaa-4aaa-8aaa-" + String(n).padStart(12, "0");
describe("TPO by-company report links",()=>{
 it("links canonical company IDs without inventing name matches",()=>{
  const result=buildTpoCompanyReportLinks([{companyId:id(1),companyName:"Acme"},{companyId:id(1),companyName:"Acme duplicate"},{companyId:"not-id",companyName:"Unverified"}]);
  expect(result.total).toBe(1);
  expect(result.rows[0]?.href).toBe("/tpo/companies/"+id(1));
 });
 it("caps navigation without claiming full pagination",()=>{
  const rows=Array.from({length:125},(_,i)=>({companyId:id(i+1),companyName:"Employer "+i}));
  const result=buildTpoCompanyReportLinks(rows);
  expect(result.total).toBe(125);
  expect(result.rows).toHaveLength(100);
  expect(result.truncated).toBe(true);
 });
});
