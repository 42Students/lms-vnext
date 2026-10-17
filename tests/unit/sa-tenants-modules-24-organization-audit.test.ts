import {describe,it,expect} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {readFileSync} from "node:fs";
describe("SA-tenants-modules-24 organization mutation audit",()=>{
 it("has stable organization activity event types",()=>{
  expect(ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_CREATED).toBe("platform.organization.created");
  expect(ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_RENAMED).toBe("platform.organization.renamed");
  expect(ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_ARCHIVED).toBe("platform.organization.archived");
 });
 it("emits an event from the mutation transaction",()=>{
  const src=readFileSync(new URL("../../src/modules/organizations/service.ts",import.meta.url),"utf8");
  expect((src.match(/recordActivityEventInTransaction\(tx,context/g)??[]).length).toBe(4);
 });
});
