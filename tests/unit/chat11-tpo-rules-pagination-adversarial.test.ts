import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {parseTpoRulesPageParams} from "@/modules/placements/tpo-settings-model";

describe("TPO-settings-audit-RULES-PAGE-01 placement rules URL parsing",()=>{
 it("accepts only canonical decimal pages and the absent-page default",()=>{
  expect(parseTpoRulesPageParams({})).toBe(1);
  expect(parseTpoRulesPageParams({page:"1"})).toBe(1);
  expect(parseTpoRulesPageParams({page:"10000"})).toBe(10000);
  for(const page of ["","0","0001","01","0x10","1e3","1.0","+1","-1",
    " 1","1 ","Infinity","NaN","10001","99999999999999999999"]){
   expect(parseTpoRulesPageParams({page}),page).toBeNull();
  }
 });
 it("fails closed on repeated, foreign or caller-identity parameters",()=>{
  for(const query of [
   {page:["1","2"]},{page:[]},{page:["1"]},
   {collegeId:"forged"},{userId:"other"},
   {page:"1",status:"ALL"},{page:"1",collegeId:"other"},
  ])expect(parseTpoRulesPageParams(query)).toBeNull();
 });
 it("does not query rules or job policy data for an invalid query",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/settings/rules/page.tsx","utf8");
  const service=readFileSync("src/modules/placements/tpo-settings-read-service.ts","utf8");
  const parsed=page.indexOf("parseTpoRulesPageParams(params)");
  const denied=page.indexOf("if (selectedPage === null)");
  const read=page.indexOf("await getTpoPlacementRulesSettings(context,{page:selectedPage})");
  const version=page.indexOf("await getCollegePlacementRules(context, context.membership.collegeId)");
  expect(parsed).toBeGreaterThan(0);
  expect(denied).toBeGreaterThan(parsed);
  expect(read).toBeGreaterThan(denied);
  expect(version).toBeGreaterThan(read);
  expect(page).toContain("Invalid placement rules filters");
  expect(page).toContain("Clear filters");
  expect(page).not.toContain("params.page[0]");
  expect(service).not.toContain("z.coerce");
  expect(service).toContain("page: z.union([");
  expect(service).toContain("max(10000)");
 });
});
