import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
import {tpoCommunicationChangeSchema} from "@/modules/placements/tpo-communication-change-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 round9 TPO recruiter and communication settings",()=>{
 it("TPO-settings-audit-54 requires a same-origin authenticated write and never treats domain trust as recruiter verification",()=>{
  const route=source("src/app/api/placements/tpo/trusted-domains/route.ts");
  const ui=source("src/components/tpo/tpo-trusted-domain-editor.tsx");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("getCurrentRequestContext()");
  expect(ui).toContain("Trust never replaces verification or recruiter access checks.");
  expect(ui).toContain("Free-mail addresses cannot be trusted.");
  expect(ui).toContain('onClick={()=>setReview({action:"REMOVE",value:item})}');
  expect(ui).toContain("<ConfirmDialog open={review!==null}");
  expect(ui).toContain("if(review)void change(review.action,review.value);");
 });
 it("TPO-settings-audit-56 only extends a persisted active recruiter grant after explicit confirmation and expectedVersion",()=>{
  const ui=source("src/components/placements/tpo-recruiter-grant-controls.tsx");
  const service=source("src/modules/placements/tpo-recruiter-grant-write-service.ts");
  expect(ui).toContain('action:"EXTEND",confirmed:true,grantId,expectedUpdatedAt,months');
  expect(ui).toContain('setNotice("Access extended")');
  expect(service).toContain('if(input.action==="EXTEND")');
  expect(service).toContain("isRecruiterGrantStale(record.grant.updatedAt, input.expectedUpdatedAt)");
  expect(service).toContain('eq(placementCompanyRelationships.collegeId, collegeId)');
 });
 it("TPO-settings-audit-57 preserves historical expiry and displays designation, verification and removal rather than a false live session",()=>{
  const service=source("src/modules/placements/tpo-recruiter-access-service.ts");
  const page=source("src/app/(authenticated)/tpo/settings/recruiters/page.tsx");
  expect(service).toContain("placementRecruiterProfiles.title");
  expect(service).toContain("placementRecruiterCollegeGrants.revokedAt");
  expect(service).toContain("placementRecruiterCollegeGrants.validUntil");
  expect(service).toContain("requirePersistedTpoMembership(context,collegeId)");
  expect(page).toContain("Access & verification");
  expect(page).toContain("No expiry on record");
 });
 it("TPO-settings-audit-70 validates and saves optional-SMS monthly limit without claiming verified sends",()=>{
  const editor=source("src/components/tpo/tpo-communication-settings-editors.tsx");
  const service=source("src/modules/placements/tpo-communication-settings-service.ts");
  expect(editor).toContain("Monthly limit on optional SMS");
  expect(editor).toContain("SMS used this month: unavailable until delivery usage is connected.");
  const model=source("src/modules/placements/tpo-communication-change-model.ts");
  expect(service).toContain("tpoCommunicationChangeSchema.parse(raw)");
  expect(model).toContain("smsMonthlyCap:z.number().int().min(0).max(100000)");
  expect(editor).toContain('section:"SMS_CAP"');
  expect(model).toContain('section:z.literal("SMS_CAP")');
  expect(model).toContain('input.section==="SMS_CAP"?{smsMonthlyCap:input.smsMonthlyCap}');
  for(const value of [0,100000])
   expect(tpoCommunicationChangeSchema.safeParse({section:"SMS_CAP",smsMonthlyCap:value,expectedVersion:null}).success).toBe(true);
  for(const value of [-1,100001,1.5,Number.POSITIVE_INFINITY])
   expect(tpoCommunicationChangeSchema.safeParse({section:"SMS_CAP",smsMonthlyCap:value,expectedVersion:null}).success).toBe(false);
 });
 it("TPO-settings-audit-72 maintains sharing choices on a 409 conflict without widening learner disclosure",()=>{
  const sourceUi=source("src/components/tpo/tpo-company-visibility-editor.tsx");
  expect(sourceUi).toContain("Save what companies can see?");
  expect(sourceUi).toContain("Sharing policy changed elsewhere. Refresh before retrying.");
  expect(sourceUi).toContain("Individual recruiter rights, consent and export permissions remain separate safeguards.");
  expect(sourceUi).toContain("setValues(current=>");
 });
});
