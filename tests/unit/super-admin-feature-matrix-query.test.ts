import {describe,expect,it} from "vitest";
import {adminFeatureQuerySchema} from "@/modules/module-access/admin-feature-query";
import {adminFeaturesHref} from "@/modules/module-access/admin-read-model";
describe("Super Admin feature matrix query",()=>{
 it("accepts code sorting and rejects unrecognized sort modes",()=>{
  expect(adminFeatureQuerySchema.parse({sort:"CODE"}).sort).toBe("CODE");
  expect(adminFeatureQuerySchema.safeParse({sort:"CREATED_AT"}).success).toBe(false);
  expect(adminFeaturesHref({sort:"CODE",q:"Eng",page:3})).toContain("sort=CODE");
 });
});
