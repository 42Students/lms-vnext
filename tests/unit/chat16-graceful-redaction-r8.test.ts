import {describe,expect,it} from "vitest";
import {redactAlertText,safeAlertPath,safeAlertLabel} from "@/modules/log-alerts/redaction";

/** Security-focused provider-independent cases, separate from the original
 * graceful-telegram-foundations historical failure report. */
describe("chat-16 GR-113 SA-placements-projects-113 redaction regression",()=>{
  it.each([
    ["/","/"],
    ["/api/jobs/12345?token=private","/api/jobs/[id]"],
    ["/tracker/logs/jane.smith%40example.com","/tracker/logs/[id]"],
    ["/api/users/123e4567-e89b-42d3-a456-426614174000","/api/users/[id]"],
    ["/mentor/projects/private-team-name#notes","/mentor/projects/[id]"],
    ["/superadmin/placements/confidential-company","/superadmin/placements/[id]"],
    ["/api/users/%zz","/api/users/[id]"],
    ["https://evil.example/private","/"],
    ["not-a-route","/"],
    ["/tracker/logs//private-slug","/tracker/logs/[id]"],
    ["/api/users/%252Fprivate","/api/users/[id]"],
    ["/api/students/12345","/api/students/[id]"],
  ])("SA-placements-projects-113 redacts route %s to %s",(raw,safe)=>{
    expect(safeAlertPath(raw)).toBe(safe);
  });
  it.each([
    ["Error jane@example.com", "jane@example.com"],
    ["Error +91 9876543210", "9876543210"],
    ["Authorization: Bearer ABcd1234xyz-SECRET", "ABcd1234xyz-SECRET"],
    ["Error postgres://root:password@db.internal/private", "postgres://"],
    ["Error https://internal.example/private?id=123", "https://"],
    ["values=[42,'private']", "private"],
    ["Error access_token=abcSECRET123", "abcSECRET123"],
    ["Error password=secretvalue", "secretvalue"],
    ["Error SQL params=[42, 'private']", "private"],
    ["Error at node_modules/private\n at /secrets", "at /secrets"],
  ])("SA-placements-projects-113 masks sensitive text in %s",(raw,secret)=>{
    expect(redactAlertText(raw)).not.toContain(secret);
  });
  it("SA-placements-projects-113 bounds error labels and drops control characters",()=>{
    const value=safeAlertLabel("component:\nprivate\r"+"x".repeat(200),32);
    expect(value.length).toBeLessThanOrEqual(32);
    expect(value).not.toContain("\n");
    expect(value).not.toContain("\r");
    expect(value).not.toContain("private");
  });
});
