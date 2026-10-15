import {describe,expect,it} from "vitest";
import {adminFeatureQuerySchema,featureRuleCutoff,parseAdminFeaturePageParams} from "@/modules/module-access/admin-feature-query";
import {adminFeaturesHref} from "@/modules/module-access/admin-read-model";
describe("Super Admin feature matrix query",()=>{
 it("accepts code sorting and rejects unrecognized sort modes",()=>{
  expect(adminFeatureQuerySchema.parse({sort:"CODE"}).sort).toBe("CODE");
  expect(adminFeatureQuerySchema.safeParse({sort:"CREATED_AT"}).success).toBe(false);
  expect(adminFeaturesHref({sort:"CODE",q:"Eng",page:3})).toContain("sort=CODE");
 });
 it("filters for exact stored college rule modules and preserves navigation",()=>{
  expect(adminFeatureQuerySchema.parse({module:"projects"}).module).toBe("projects");
  expect(adminFeatureQuerySchema.safeParse({module:"all"}).success).toBe(false);
  expect(adminFeaturesHref({module:"electives",page:2})).toContain("module=electives");
 });
 it("restricts stored On/Off values while retaining scoped paging",()=>{
  expect(adminFeatureQuerySchema.parse({storedState:"OFF"}).storedState).toBe("OFF");
  expect(adminFeatureQuerySchema.safeParse({storedState:"INHERIT"}).success).toBe(false);
  expect(adminFeaturesHref({module:"projects",storedState:"OFF",page:3})).toContain("storedState=OFF");
 });
 it("finds persisted locked college module rules without inferring all learner access",()=>{
  expect(adminFeatureQuerySchema.parse({locks:"LOCKED"}).locks).toBe("LOCKED");
  expect(adminFeatureQuerySchema.safeParse({locks:"UNLOCKED"}).success).toBe(false);
  expect(adminFeaturesHref({locks:"LOCKED",page:2})).toContain("locks=LOCKED");
 });
 it("distinguishes no persisted college rule from explicit On/Off, rejects contradictory filters",()=>{
  expect(adminFeatureQuerySchema.parse({module:"electives",presence:"NO_RULE"}).presence).toBe("NO_RULE");
  expect(adminFeatureQuerySchema.safeParse({presence:"NO_RULE",storedState:"OFF"}).success).toBe(false);
  expect(adminFeatureQuerySchema.safeParse({presence:"NO_RULE",locks:"LOCKED"}).success).toBe(false);
  expect(adminFeaturesHref({module:"projects",presence:"NO_RULE"})).toContain("presence=NO_RULE");
 });
 it("uses one request clock for a bounded persisted-rule freshness window",()=>{
  const now=new Date("2026-10-15T12:00:00Z");
  expect(featureRuleCutoff("7D",now)?.toISOString()).toBe("2026-10-08T12:00:00.000Z");
  expect(featureRuleCutoff("ALL",now)).toBeNull();
  expect(adminFeatureQuerySchema.safeParse({recent:"1D"}).success).toBe(false);
  expect(adminFeatureQuerySchema.safeParse({recent:"30D",presence:"NO_RULE"}).success).toBe(false);
  expect(adminFeaturesHref({recent:"30D"})).toContain("recent=30D");
 });
 it("selects name-only or code-only literal substring search",()=>{
  expect(adminFeatureQuerySchema.parse({searchField:"CODE",q:"COL"}).searchField).toBe("CODE");
  expect(adminFeatureQuerySchema.safeParse({searchField:"EMAIL"}).success).toBe(false);
  expect(adminFeaturesHref({q:"COL",searchField:"CODE",page:2})).toContain("searchField=CODE");
 });
 it("accepts deterministic descending name and code sorts without changing scope",()=>{
  expect(adminFeatureQuerySchema.parse({sort:"NAME_DESC"}).sort).toBe("NAME_DESC");
  expect(adminFeatureQuerySchema.parse({sort:"CODE_DESC"}).sort).toBe("CODE_DESC");
  expect(adminFeaturesHref({sort:"CODE_DESC",page:2})).toContain("sort=CODE_DESC");
 });
 it("rejects duplicated pagination and unknown matrix selectors before database reads",()=>{
  expect(parseAdminFeaturePageParams({page:["1","200"]})).toBeNull();
  expect(parseAdminFeaturePageParams({module:["projects","electives"]})).toBeNull();
  expect(parseAdminFeaturePageParams({q:"A",credential:"unexpected"})).toBeNull();
  expect(parseAdminFeaturePageParams({module:"projects",sort:"CODE_DESC"})).toMatchObject({module:"projects",sort:"CODE_DESC"});
 });
});
