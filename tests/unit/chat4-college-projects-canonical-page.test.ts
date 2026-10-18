import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 parseCollegeProjectsQuery,canonicalCollegeProjectsPageHref,
} from "@/modules/projects/college-projects-query-model";

describe("PROJ-BREAK-COLLEGE-04-PAGE-06 stale College Admin project bookmarks",()=>{
 it("keeps active search, status, table view and chosen page size on archive-driven page clamp",()=>{
  const parsed=parseCollegeProjectsQuery({
   q:"  capstone  ",status:"ACTIVE",view:"table",page:"99",pageSize:"50",
  });
  expect(parsed.success).toBe(true);
  if(!parsed.success)throw Error("Expected validated query");
  const href=canonicalCollegeProjectsPageHref(parsed.data,3);
  expect(href).toBe("/college/projects?q=capstone&status=ACTIVE&view=table&pageSize=50&page=3");
  const url=new URL(href!,"https://example.test");
  expect(parseCollegeProjectsQuery(Object.fromEntries(url.searchParams)).data)
   .toMatchObject({q:"capstone",status:"ACTIVE",view:"table",pageSize:50,page:3});
 });
 it("restores the empty or deleted-workspace list to page one without a forged result count",()=>{
  const parsed=parseCollegeProjectsQuery({page:"42"});
  expect(parsed.success).toBe(true);
  if(!parsed.success)throw Error("Expected validated query");
  expect(canonicalCollegeProjectsPageHref(parsed.data,0)).toBe("/college/projects");
  expect(canonicalCollegeProjectsPageHref(parsed.data,NaN)).toBe("/college/projects");
 });
 it("does not redirect a valid current page or leave a redirect loop",()=>{
  const parsed=parseCollegeProjectsQuery({page:"2",view:"cards",pageSize:"25"});
  expect(parsed.success).toBe(true);
  if(!parsed.success)throw Error("Expected validated query");
  expect(canonicalCollegeProjectsPageHref(parsed.data,3)).toBeNull();
  expect(canonicalCollegeProjectsPageHref(parsed.data,2)).toBeNull();
 });
 it("keeps malformed and cross-tenant URL filters out before building any canonical redirect",()=>{
  for(const params of [
   {page:["2","99"]},{collegeId:"other-tenant"},{page:"1e2"},
   {status:"REMOVED"},{pageSize:"0x32"},
  ])expect(parseCollegeProjectsQuery(params).success).toBe(false);
 });
 it("redirects only after a scoped snapshot read and before an inconsistent list/pagination renders",()=>{
  const source=readFileSync("src/app/(authenticated)/college/projects/page.tsx","utf8");
  const snapshots=source.indexOf("listProjectAdminSnapshots(context, collegeId, query)");
  const canonical=source.indexOf("canonicalCollegeProjectsPageHref(query,result.totalPages)");
  const list=source.indexOf("<ProjectAdminWorkspaceList");
  expect(snapshots).toBeGreaterThan(0);
  expect(canonical).toBeGreaterThan(snapshots);
  expect(list).toBeGreaterThan(canonical);
  expect(source).toContain("if(canonical)redirect(canonical)");
 });
});
