import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 tpoCommunicationChangeSchema,tpoCommunicationChanges,
 tpoCommunicationUpdateAlreadyApplied,
} from "@/modules/placements/tpo-communication-change-model";

const version="2026-10-18T11:59:59.123+05:30";
const cases=[
 {section:"SMS_CAP",smsMonthlyCap:500,expectedVersion:version},
 {section:"SIGNATURE",emailSignature:"Placement Cell",expectedVersion:version},
 {section:"PREP_THRESHOLD",prepThresholdPct:75,expectedVersion:version},
 {section:"RECRUITER_DURATION",recruiterAccessMonths:6,expectedVersion:version},
 {section:"OPTIONAL_EMAILS",notifyDriveOpenEmail:true,notifyResultApplied:false,
  notifyNudges:true,notifyPrepAssigned:false,expectedVersion:version},
] as const;

describe("TPO-settings-audit-CAS-01 section changes are validated and idempotent",()=>{
 it("accepts one exact strict payload per section and extracts only the affected columns",()=>{
  for(const example of cases){
   const result=tpoCommunicationChangeSchema.safeParse(example);
   expect(result.success,example.section).toBe(true);
   if(!result.success)continue;
   const changes=tpoCommunicationChanges(result.data);
   expect(changes).not.toHaveProperty("section");
   expect(changes).not.toHaveProperty("expectedVersion");
   expect(Object.keys(changes).length).toBe(example.section==="OPTIONAL_EMAILS"?4:1);
   expect(tpoCommunicationUpdateAlreadyApplied({...changes},changes)).toBe(true);
   for(const [key,value] of Object.entries(changes)){
    expect(tpoCommunicationUpdateAlreadyApplied({...changes,[key]:typeof value==="boolean"?!value:
     typeof value==="number"?value+1:value+"!"},changes)).toBe(false);
   }
  }
 });
 it("rejects unsupported sections, out-of-range limits, partial preferences and stale-token shapes",()=>{
  const invalid=[
   {...cases[0],smsMonthlyCap:-1},{...cases[0],smsMonthlyCap:100001},
   {...cases[0],smsMonthlyCap:0.1},{...cases[1],emailSignature:"x".repeat(301)},
   {...cases[2],prepThresholdPct:101},{...cases[2],prepThresholdPct:1.5},
   {...cases[3],recruiterAccessMonths:9},
   {...cases[4],notifyNudges:"true"},
   {section:"OPTIONAL_EMAILS",notifyDriveOpenEmail:true,expectedVersion:version},
   {...cases[0],expectedVersion:"yesterday"},
   {...cases[0],collegeId:"11111111-1111-4111-8111-111111111111"},
   {section:"ADMIN_OVERRIDE",smsMonthlyCap:0,expectedVersion:version},
  ];
  for(const value of invalid)expect(tpoCommunicationChangeSchema.safeParse(value).success,
   JSON.stringify(value)).toBe(false);
  expect(tpoCommunicationChangeSchema.safeParse({...cases[0],expectedVersion:null}).success).toBe(true);
 });
 it("only a changed write passes CAS, audits changes and never no-op notifies",()=>{
  const source=readFileSync("src/modules/placements/tpo-communication-settings-service.ts","utf8");
  const lock=source.indexOf('.for("update")');
  const noOp=source.indexOf("tpoCommunicationUpdateAlreadyApplied(current,changes)");
  const stale=source.indexOf("TPO_SETTINGS_STALE",noOp);
  const updated=source.indexOf("await tx.update(placementTpoCollegeSettings)",stale);
  const activity=source.indexOf("await tx.insert(activityEvents)",updated);
  expect(lock).toBeGreaterThan(0);
  expect(noOp).toBeGreaterThan(lock);
  expect(stale).toBeGreaterThan(noOp);
  expect(updated).toBeGreaterThan(stale);
  expect(activity).toBeGreaterThan(updated);
  expect(source).toContain("requireTpoBatchActor(context)");
  expect(source).toContain("where(eq(placementTpoCollegeSettings.collegeId,collegeId))");
 });
});

describe("TPO-settings-audit-PREP-02 threshold preference retries",()=>{
 it("blocks immediate duplicate actions, preserves the accepted version and renders safe errors",()=>{
  const source=readFileSync("src/components/tpo/tpo-prep-percentage-editor.tsx","utf8");
  expect(source).toContain("inFlight.current=true");
  expect(source).toContain("if(!Number.isInteger(percent)||percent<0||percent>100||percent===saved||inFlight.current)return");
  expect(source).toContain("inFlight.current=false");
  expect(source).toContain("expectedVersion:currentVersion");
  expect(source).toContain("setCurrentVersion(result.version??currentVersion)");
  expect(source).toContain("setSaved(percent)");
  expect(source).toContain('e.target.value===""?-1:Number(e.target.value)');
  expect(source).toContain("response.status===401");
  expect(source).toContain("response.status===403");
  expect(source).toContain("response.status===409");
  expect(source).toContain("response.status===503");
  expect(source).not.toContain("throw Error(result.error");
  expect(source).toContain('role="alert"');
 });
});

describe("TPO-settings-audit-EMAIL-01 graceful, duplicate-safe optional email controls",()=>{
 it("latches synchronously, maps known statuses, never renders an untrusted API error",()=>{
  const source=readFileSync("src/components/tpo/tpo-optional-emails-editor.tsx","utf8");
  expect(source).toContain("if(inFlight.current||!dirty)return");
  expect(source).toContain("inFlight.current=true");
  expect(source).toContain("inFlight.current=false");
  expect(source).toContain("response.status===401");
  expect(source).toContain("response.status===403");
  expect(source).toContain("response.status===409");
  expect(source).toContain("response.status===503");
  expect(source).not.toContain("throw Error(result.error");
  expect(source).not.toContain("setError(result.error");
  expect(source).toContain("setSaved({...value})");
  expect(source).toContain("setCurrentVersion(result.version??currentVersion)");
  expect(source).toContain('role="alert"');
  expect(source).toContain('credentials:"same-origin"');
 });
});
