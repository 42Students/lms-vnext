import {describe,expect,it} from "vitest";
import {redactAlertText,safeAlertPath} from "@/modules/log-alerts/redaction";
import {errorSignatureHash,normaliseErrorForSignature} from "@/modules/log-alerts/signature";

describe("SA-placements-projects-114 Round 2 stable redaction signatures",()=>{
 it.each([
  ["Failed to load profile for alice@example.com at /students/123e4567-e89b-42d3-a456-426614174001",
   "/api/students/123e4567-e89b-42d3-a456-426614174001"],
  ["Request 923e4567-e89b-42d3-a456-426614174777 timed out for bob@example.com",
   "/api/jobs/923e4567-e89b-42d3-a456-426614174777"],
  ["Application 123e4567-e89b-42d3-a456-426614174000 could not load",
   "/api/placements/applications/123e4567-e89b-42d3-a456-426614174000"],
 ])("SA-placements-projects-114 signature equality before and after privacy redaction: %s",(message,path)=>{
   const raw=errorSignatureHash({environment:"PRODUCTION",message,path});
   const once=errorSignatureHash({environment:"PRODUCTION",message:redactAlertText(message),path:safeAlertPath(path)});
   const twice=errorSignatureHash({environment:"PRODUCTION",message:redactAlertText(redactAlertText(message)),path:safeAlertPath(safeAlertPath(path))});
   expect(raw).toBe(once);
   expect(once).toBe(twice);
   expect(raw).toMatch(/^[0-9a-f]{64}$/);
 });
 it("SA-placements-projects-114 never reveals an email or UUID in canonical signature text",()=>{
  const canonical=normaliseErrorForSignature("Failure for alice@example.com at 123e4567-e89b-42d3-a456-426614174000");
  expect(canonical).not.toContain("alice@example.com");
  expect(canonical).not.toContain("123e4567-e89b-42d3-a456-426614174000");
 });
});