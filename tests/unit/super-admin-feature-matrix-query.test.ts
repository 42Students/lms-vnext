import {describe,expect,it} from "vitest";
import {adminFeatureQuerySchema} from "@/modules/module-access/admin-feature-query";
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
});
