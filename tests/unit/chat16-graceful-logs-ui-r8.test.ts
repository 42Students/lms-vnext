import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {friendlyApiError} from "@/lib/friendly-error";
import {cloudLogPollConfigured} from "@/modules/log-alerts/readiness";
const code=(path:string)=>readFileSync(path,"utf8");

describe("chat-16 SA-placements-projects-113 GR-123/124 Logs UI and safeguards",()=>{
  it.each([
    ['from "@/hooks/use-guarded-action"'],
    ['from "@/lib/api-fetch"'],
    ["await run(async () =>"],
    ['action: "ACKNOWLEDGE"'],
    ['status: "FIXED"'],
    ['action: "MUTE"'],
    ["error instanceof FriendlyFetchError"],
    ["friendlyApiError({})"],
    ["router.refresh()"],
    ["setConfirmMute(false)"],
    ["No tracked errors yet"],
    ["Why is it safe to ignore? It comes back on its own if it suddenly spikes."],
  ])("SA-placements-projects-113 keeps the guarded Known Errors contract: %s",(value)=>{
    expect(code("src/components/tracker/known-errors-workspace.tsx")).toContain(value);
  });
  it("SA-placements-projects-113 does not expose unchecked native fetch error messages",()=>{
    const source=code("src/components/tracker/known-errors-workspace.tsx");
    expect(source).not.toMatch(/\bawait fetch\(/);
    expect(source).not.toMatch(/error instanceof Error\s*\?\s*error\.message/);
    expect(source).not.toMatch(/description:\s*error\.message\b/);
  });
  it("SA-placements-projects-113 keeps Cloud Logging explicitly disabled without opt-in",()=>{
    const before=process.env.LOG_ALERT_CLOUD_POLL_ENABLED;
    try{
      delete process.env.LOG_ALERT_CLOUD_POLL_ENABLED;
      expect(cloudLogPollConfigured()).toBe(false);
    }finally{
      if(before===undefined)delete process.env.LOG_ALERT_CLOUD_POLL_ENABLED;
      else process.env.LOG_ALERT_CLOUD_POLL_ENABLED=before;
    }
    expect(code("src/app/(authenticated)/tracker/logs/page.tsx"))
      .toContain("Cloud Logging backup is not configured.");
  });
  it.each([
    [400,"INVALID_REQUEST"],
    [403,"FORBIDDEN"],
    [404,"KNOWN_ERROR_NOT_FOUND"],
    [503,"DATABASE_UNAVAILABLE"],
  ])("SA-placements-projects-113 returns customer-safe text for %s/%s",(status,error)=>{
    const message=friendlyApiError({status,code:error});
    expect(message).not.toBe(error);
    expect(message).not.toMatch(/^[A-Z][A-Z0-9_]{5,}$/);
  });
});
