import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
describe("SA-tenants-modules-24 tenant write audit",()=>{
 it("defines college creation/update/archive event types",()=>{
  expect(ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_CREATED).toBe("platform.college.created");
  expect(ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_UPDATED).toBe("platform.college.updated");
  expect(ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_ARCHIVED).toBe("platform.college.archived");
 });
 it("writes each tenant mutation and event inside a transaction",()=>{
  const source=readFileSync(new URL("../../src/modules/colleges/service.ts",import.meta.url),"utf8");
  expect((source.match(/recordActivityEventInTransaction\(tx,context/g)??[]).length).toBe(4);
  expect(source).toContain("return await db.transaction(async tx=>");
  // Three college mutation transactions plus one independently scoped read transaction.
  expect((source.match(/return getDb\(\).transaction\(async tx=>/g)??[]).length).toBe(4);
 });
});
