import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoCompanyFiltersShapeValid}
 from "@/modules/placements/tpo-company-url-validation";

describe("UX-tpo-companies-duplicate-filters-01 legacy Company Memory links",()=>{
 it("accepts single exact directory and named company links",()=>{
  expect(tpoCompanyFiltersShapeValid({})).toBe(true);
  expect(tpoCompanyFiltersShapeValid({directory:"1",page:"2",pageSize:"25",sort:"JOINS"})).toBe(true);
  expect(tpoCompanyFiltersShapeValid({name:"Example Employer Ltd"})).toBe(true);
  expect(tpoCompanyFiltersShapeValid({name:"A".repeat(160)})).toBe(true);
 });
 it("rejects ambiguous name, page, filters and directory values without choosing first",()=>{
  for(const bad of [
   {name:["Employer A","Employer B"]},{page:["1","2"]},
   {search:["A","B"]},{sort:["DRIVES","JOINS"]},
   {directory:"0"},{directory:"false"},
   {name:"A".repeat(161)},
   {name:{nested:"hidden"}},{page:42},
  ])expect(tpoCompanyFiltersShapeValid(bad)).toBe(false);
 });
 it("refuses unknown tenant selector injection or unsupported control flags",()=>{
  for(const bad of [
   {collegeId:"other-college"},{organizationId:"other-org"},
   {scope:"ALL"},{module:"INTERNAL"},{role:"SUPER_ADMIN"},
  ])expect(tpoCompanyFiltersShapeValid(bad)).toBe(false);
 });
 it("page checks current TPO before parsing and never fetches directory for invalid input",()=>{
  const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
  const page=read("src/app/(authenticated)/tpo/companies/page.tsx");
  const role=page.indexOf("await requireTpoBatchActor(context)");
  const filter=page.indexOf("tpoCompanyFiltersShapeValid(raw)");
  const lookup=page.indexOf("await getTpoCompaniesView(context, query)");
  expect(role).toBeGreaterThan(0);
  expect(filter).toBeGreaterThan(role);
  expect(lookup).toBeGreaterThan(filter);
  expect(page).toContain("Invalid companies filters");
  expect(page).toContain("No company data was loaded.");
  expect(page).toContain('role="alert"');
  const service=read("src/modules/placements/tpo-company-memory-service.ts");
  expect(service).toContain("if (!name || name.length>160)");
 });
});
