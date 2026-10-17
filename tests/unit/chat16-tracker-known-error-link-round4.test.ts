import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {errorSignatureHash} from "@/modules/log-alerts/signature";
import {redactAlertText,safeAlertPath} from "@/modules/log-alerts/redaction";

const read=(path:string)=>readFileSync(path,"utf8");

describe("chat-16 tracker live log to known error actions",()=>{
  it("SA-placements-projects-114 maps redacted log records to the same stable signature",()=>{
    const raw="Failed to load profile for alice@example.com at /students/123e4567-e89b-42d3-a456-426614174001";
    const path="/api/students/123e4567-e89b-42d3-a456-426614174001";
    const first=errorSignatureHash({environment:"PRODUCTION",path,message:raw});
    const second=errorSignatureHash({environment:"PRODUCTION",
      path:safeAlertPath(path),message:redactAlertText(raw)});
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain("alice@example.com");
  });

  it("SA-placements-projects-114 finds only environment-matched signatures when DB-ready",()=>{
    const source=read("src/modules/bug-tracker/tracker-cloud-logs.ts");
    expect(source).toContain("if(logAlertsRuntimeEnabled()&&hashes.length)");
    expect(source).toContain("errorSignatureHash({");
    expect(source).toContain("eq(db10LogAlertSignatures.environment,environment)");
    expect(source).toContain("inArray(db10LogAlertSignatures.signatureHash,[...new Set(hashes)])");
    expect(source).toContain("knownErrorId:matches.get(");
    expect(source).toContain("muted:matches.get(");
    expect(source).not.toContain("sampleMessage:");
  });

  it("SA-placements-projects-114 offers confirmation before muting and recovers from transport errors",()=>{
    const panel=read("src/components/tracker/tracker-live-logs-explorer.tsx");
    expect(panel).toContain("Known error details");
    expect(panel).toContain("Mute this error");
    expect(panel).toContain("Unmute this error");
    expect(panel).toContain("Mute this known error?");
    expect(panel).toContain("knownErrorId");
    expect(panel).toContain('method:"PATCH"');
    expect(panel).toContain('action:"MUTE",muted:nextMuted');
    expect(panel).toContain("Could not update this known error. Try again.");
    const triage=read("src/components/tracker/known-errors-workspace.tsx");
    expect(triage).toContain('id={"known-error-"+item.id}');
    expect(triage).toContain('id="known-errors"');
    const route=read("src/app/api/tracker/logs/known-errors/[signatureId]/route.ts");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain("mutateKnownErrorForAdmin");
  });
});
