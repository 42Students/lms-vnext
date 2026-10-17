import {describe,expect,it} from "vitest";
import {normaliseErrorForSignature,errorSignatureHash} from "@/modules/log-alerts/signature";

describe("chat-16 GR-112 SA-placements-projects-114 deterministic error grouping",()=>{
  it.each([
    ["Job 42 failed","Job 99 failed"],
    ["Failure at 2099-10-17T01:00:00Z","Failure at 2099-10-18T12:30:00+05:30"],
    ["Failure at 2099-10-17T01:00:00.123Z","Failure at 2099-10-18T01:00:00.432+05:30"],
    ["Error ID 123e4567-e89b-42d3-a456-426614174000","Error ID 923e4567-e89b-42d3-a456-426614174777"],
    ["Crash (Request ID: af02b19c)","Crash (Request ID: 9bed006a)"],
    ["Failure for alice@example.com","Failure for bob@example.com"],
    ["Failure 0xdeadbeef","Failure 0xfeedcafe"],
    ["Quota 12.3 exceeded","Quota 98.7 exceeded"],
  ])("SA-placements-projects-114 coalesces equivalent transient faults: %s",(a,b)=>{
    expect(normaliseErrorForSignature(a)).toEqual(normaliseErrorForSignature(b));
    expect(errorSignatureHash({environment:"PRODUCTION",message:a,path:"/api/jobs/12345"}))
      .toEqual(errorSignatureHash({environment:"PRODUCTION",message:b,path:"/api/jobs/98765"}));
  });
  it.each([
    ["TypeError: Request failed","RangeError: Request failed"],
    ["Failed to create project","Failed to delete project"],
    ["No student found","No employer found"],
    ["File scan rejected","File upload accepted"],
  ])("SA-placements-projects-114 keeps different faults separate: %s",(a,b)=>{
    expect(normaliseErrorForSignature(a)).not.toEqual(normaliseErrorForSignature(b));
  });
  it("SA-placements-projects-114 separates environments despite identical messages",()=>{
    const message="Timeout on attempt 42",path="/api/jobs/12345";
    const prod=errorSignatureHash({environment:"PRODUCTION",message,path});
    expect(errorSignatureHash({environment:"UAT",message,path})).not.toBe(prod);
    expect(errorSignatureHash({environment:"DEVELOPMENT",message,path})).not.toBe(prod);
  });
  it("SA-placements-projects-114 never hashes stack traces or multiline private payloads",()=>{
    const a="Database unavailable\nuser alice@example.com secret password";
    const b="Database unavailable\nuser bob@example.com";
    expect(errorSignatureHash({environment:"PRODUCTION",message:a,path:"/api/jobs/42"}))
      .toBe(errorSignatureHash({environment:"PRODUCTION",message:b,path:"/api/jobs/99"}));
    expect(normaliseErrorForSignature(a)).not.toContain("password");
  });
});
