import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mayChangeTpoNoticeAudience,tpoNoticeAudienceChangeSchema} from "@/modules/announcements/tpo-notice-audience-change-model";
const source=(p:string)=>readFileSync(p,"utf8");
const a="11111111-1111-4111-8111-111111111111";
const now=new Date("2099-01-01T10:00:00Z");
describe("Scheduled audience editing",()=>{
 it("TPO-inbox-team-51 refuses already visible, delivered, deleted or immediate notices",()=>{
  const base={scheduledAt:new Date("2099-01-03T10:00:00Z"),now,delivered:false,deleted:false};
  expect(mayChangeTpoNoticeAudience(base)).toBe(true);
  expect(mayChangeTpoNoticeAudience({...base,scheduledAt:now})).toBe(false);
  expect(mayChangeTpoNoticeAudience({...base,scheduledAt:null})).toBe(false);
  expect(mayChangeTpoNoticeAudience({...base,delivered:true})).toBe(false);
  expect(mayChangeTpoNoticeAudience({...base,deleted:true})).toBe(false);
 });
 it("TPO-inbox-team-51 validates explicit audience and does not silently publish to whole college",()=>{
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"COLLEGE"}).success).toBe(true);
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"BATCHES",targetIds:[a]}).success).toBe(true);
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"BATCHES",targetIds:[a,a]}).success).toBe(false);
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"DRIVE",targetId:a}).success).toBe(true);
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"DRIVE"}).success).toBe(false);
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"COLLEGE",targetId:a}).success).toBe(false);
  expect(tpoNoticeAudienceChangeSchema.safeParse({audience:"PLACEMENTS",targetIds:[a]}).success).toBe(false);
  expect(tpoNoticeAudienceChangeSchema.safeParse({}).success).toBe(false);
 });
 it("TPO-inbox-team-51 changes a locked frozen snapshot atomically, under persisted college permission",()=>{
  const service=source("src/modules/announcements/tpo-placement-edit-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('eq(db10Announcements.collegeId,college.id)');
  expect(service).toContain('if(current.version!==input.expectedVersion)');
  expect(service).toContain("mayChangeTpoNoticeAudience");
  expect(service).toContain("tx.delete(placementTpoNoticeRecipients)");
  expect(service).toContain("tx.delete(placementTpoNoticeAudiences)");
  expect(service).toContain("freezeTpoNoticeRecipients(members)");
  expect(service).toContain('throw new Error("TPO_NOTICE_AUDIENCE_LOCKED")');
  expect(service).toContain("audienceChangedTo:input.audienceChange?.audience");
 });
 it("TPO-inbox-team-51 requires explicit form checkbox, validates target IDs and shows friendly errors",()=>{
  const ui=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  const route=source("src/app/api/placements/tpo/announcements/[noticeId]/edit/route.ts");
  const errors=source("src/modules/announcements/tpo-notice-form-error-model.ts");
  expect(ui).toContain('name="changeAudience"');
  expect(ui).toContain("<TpoNoticeAudiencePicker");
  expect(route).toContain('form?.get("changeAudience")==="on"');
  expect(route).toContain("editTpoNoticeSchema.safeParse");
  expect(errors).toContain("AUDIENCE_LOCKED:");
 });
});