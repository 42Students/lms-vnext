import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("Historical admin audit category parity",()=>{
 it("uses source action keys and entity types ahead of mapped event aliases",()=>{
  const source=readFileSync("src/modules/activity/service.ts","utf8");
  expect(source).toContain('lower(coalesce(${activityEvents.legacyEntityType},${activityEvents.subjectType}))');
  expect(source).toContain('upper(coalesce(${activityEvents.legacyActionKey},${activityEvents.eventType}))');
  expect(source).toContain("BATCH[._]SEMESTER[._]UPDATE");
  expect(source).toContain("'project','project_task','project_template'");
 });
 it("retains audit origin provenance without exposing raw IP or user agent",()=>{
  const source=readFileSync("src/db/schema/activity.ts","utf8");
  expect(source).toContain('sourceIpHash: varchar("source_ip_hash"');
  expect(source).toContain('sourceUserAgentFamily: varchar("source_user_agent_family"');
  expect(source).not.toContain('varchar("ip_address"');
  expect(source).not.toContain('varchar("user_agent"');
 });
});
