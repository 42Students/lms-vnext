import {describe,expect,it} from "vitest";
import {
 COLLEGE_COMPANIES_PAGE_SIZE,COLLEGE_COMPANIES_PAGE_SIZES,
 parseCollegeCompaniesQuery,collegeCompaniesHref,literalCompanySearch,
} from "@/modules/placements/college-company-directory-model";

describe("COL-placements-15 archived company query integrity",()=>{
 it("COL-placements-15 defaults to active rows, bounded pages and last activity",()=>{
  expect(parseCollegeCompaniesQuery({})).toMatchObject({
   success:true,data:{q:"",page:1,pageSize:10,sort:"LAST_ACTIVE",showDeleted:"0"},
  });
  expect(COLLEGE_COMPANIES_PAGE_SIZE).toBe(10);
  expect(COLLEGE_COMPANIES_PAGE_SIZES).toEqual([10,20,50,100]);
 });
 it.each(["0","1"])("COL-placements-15 accepts only registered showDeleted=%s",showDeleted=>{
  expect(parseCollegeCompaniesQuery({showDeleted}).success).toBe(true);
 });
 it.each(["","true","false","ACTIVE","ARCHIVED","2"])(
  "COL-placements-15 denies unregistered archived flag %s",showDeleted=>{
   expect(parseCollegeCompaniesQuery({showDeleted}).success).toBe(false);
 });
 it.each(["10","20","50","100"])("COL-placements-15 accepts supported page size %s",pageSize=>{
  expect(parseCollegeCompaniesQuery({pageSize}).success).toBe(true);
 });
 it.each(["0","1","11","25","101","1000"])(
  "COL-placements-15 refuses unsupported page size %s",pageSize=>{
   expect(parseCollegeCompaniesQuery({pageSize}).success).toBe(false);
 });
 it.each(["LAST_ACTIVE","COMPANY","DRIVES"])(
  "COL-placements-15 preserves sortable company column %s",sort=>{
   expect(parseCollegeCompaniesQuery({sort}).success).toBe(true);
 });
 it.each(["name","RATING","DROP TABLE",""])(
  "COL-placements-15 denies non-whitelisted sort %s",sort=>{
   expect(parseCollegeCompaniesQuery({sort}).success).toBe(false);
 });
 it.each(["0","-1","1001","1.5","Infinity"])(
  "COL-placements-15 rejects invalid page %s",page=>{
   expect(parseCollegeCompaniesQuery({page}).success).toBe(false);
 });
 it("COL-placements-15 rejects tenant IDs, extra fields and repeated filters",()=>{
  expect(parseCollegeCompaniesQuery({collegeId:"outside-college"}).success).toBe(false);
  expect(parseCollegeCompaniesQuery({showDeleted:["0","1"]}).success).toBe(false);
  expect(parseCollegeCompaniesQuery({q:["alpha","beta"]}).success).toBe(false);
 });
 it("COL-placements-15 safely preserves filters in paged links",()=>{
  const parsed=parseCollegeCompaniesQuery({
   q:"A&B 100%",sort:"DRIVES",pageSize:"50",showDeleted:"1",page:"2",
  });
  expect(parsed.success).toBe(true);
  if(!parsed.success)return;
  const url=new URL(collegeCompaniesHref(parsed.data),"https://example.test");
  expect(url.origin).toBe("https://example.test");
  expect(url.pathname).toBe("/college/companies");
  for(const [key,value] of Object.entries({q:"A&B 100%",sort:"DRIVES",pageSize:"50",showDeleted:"1",page:"2"})){
   expect(url.searchParams.get(key)).toBe(value);
  }
 });
 it("COL-placements-15 emits compact default links and neutralizes SQL wildcards",()=>{
  const parsed=parseCollegeCompaniesQuery({});
  expect(parsed.success).toBe(true);
  if(!parsed.success)return;
  expect(collegeCompaniesHref(parsed.data)).toBe("/college/companies");
  // SQL LIKE escaping uses exactly one backslash per literal wildcard.
  expect(literalCompanySearch("A_B%")).toBe("%A\\_B\\%%");
 });
});
