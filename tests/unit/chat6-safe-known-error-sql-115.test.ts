import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {knownErrorSafeSql} from "@/modules/log-alerts/known-error-safe-summary";
describe("Safe Super Admin known-error SQL triage",()=>{
 it("SA-placements-projects-115 copies only bounded aggregate SQL for a 64-hex signature and safe environment",()=>{
  const hash="a".repeat(64);
  const statement=knownErrorSafeSql({signatureHash:hash,environment:"production"});
  expect(statement).not.toBeNull();
  expect(statement).toContain("FROM log_alert_signatures");
  expect(statement).toContain("WHERE environment = 'production'");
  expect(statement).toContain("signature_hash = '"+hash+"'");
  expect(statement).toContain("LIMIT 1;");
  expect(statement).not.toMatch(/sample_message|sample_path|account_key_hash|SELECT \*/i);
  const panel=readFileSync("src/components/tracker/known-errors-workspace.tsx","utf8");
  expect(panel).toContain("Copy SQL to check the data");
  expect(panel).toContain("knownErrorSafeSql");
  expect(panel).toContain("Create tracker issue");
 });
 it("SA-placements-projects-115 refuses invalid clipboard SQL and injection input",()=>{
  expect(knownErrorSafeSql({signatureHash:"a".repeat(63),environment:"production"})).toBeNull();
  expect(knownErrorSafeSql({signatureHash:"a".repeat(64),environment:"prod';DROP TABLE users;--"})).toBeNull();
  expect(knownErrorSafeSql({signatureHash:"z".repeat(64),environment:"production"})).toBeNull();
 });
});
