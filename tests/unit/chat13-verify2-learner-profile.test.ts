import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { learnerProfileDocumentSchema } from "@/modules/people/profile-validation";
import {
  learnerContactEditSchema,
  validateLearnerAlternatePhoneAgainstPrimary,
} from "@/modules/people/learner-contact-model";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("Lane 13 verification: learner contact, preferences and signed resume",()=>{
 it("keeps missing notification preferences opt-in but never overwrites an explicit opt-out",()=>{
  const fresh=learnerProfileDocumentSchema.parse({});
  expect(fresh.jobPreferences.jobNotificationsEnabled).toBe(true);
  const optedOut=learnerProfileDocumentSchema.parse({
    jobPreferences:{jobNotificationsEnabled:false,examSlotPreference:"Morning",papInterest:"Yes"},
  });
  expect(optedOut.jobPreferences.jobNotificationsEnabled).toBe(false);
  expect(optedOut.jobPreferences.examSlotPreference).toBe("Morning");
  expect(optedOut.jobPreferences.papInterest).toBe("Yes");
  expect(learnerProfileDocumentSchema.parse(optedOut).jobPreferences)
    .toEqual(optedOut.jobPreferences);
 });
 it("enforces alternate-phone length and compares against the persisted primary identity",()=>{
  const base={confirmed:true as const,contacts:{
    alternatePhone:"91234567890",contactEmail:"faculty@example.com",
  }};
  expect(learnerContactEditSchema.safeParse(base).success).toBe(true);
  expect(learnerContactEditSchema.safeParse({...base,contacts:{
    ...base.contacts,alternatePhone:"1234",
  }}).success).toBe(false);
  expect(validateLearnerAlternatePhoneAgainstPrimary(
    "9876543210","+919876543210",
  )).toBe("ALTERNATE_PHONE_SAME_AS_PRIMARY");
  expect(validateLearnerAlternatePhoneAgainstPrimary(
    "91234567890","+919876543210",
  )).toBeNull();
  const service=read("src/modules/people/learner-contact-service.ts");
  expect(service).toContain("input.contacts.alternatePhone,user.phoneE164");
 });
 it("shows the real membership-scoped signed resume picker rather than falsely claiming it is blocked",()=>{
  const page=read("src/app/(authenticated)/learn/profile/page.tsx");
  const picker=read("src/components/profile/learner-default-resume-picker.tsx");
  const workspace=read("src/components/profile/learner-profile-workspace.tsx");
  expect(page).toContain("<LearnerDefaultResumePicker initial={defaultResumes}");
  expect(picker).toContain('grant.uploadUrl.startsWith("https://")');
  expect(picker).toContain('action: "CONFIRM"');
  expect(picker).toContain('action: "SELECT"');
  const route=read("src/app/api/profile/learner/default-resume/route.ts");
  const service=read("src/modules/placements/learner-default-resume-service.ts");
  expect(route).toContain('action: z.literal("VIEW")');
  expect(route).toContain('action: z.literal("CLEAR_DEFAULT")');
  expect(route).toContain("viewOwnLearnerResume(context, parsed.receiptId)");
  expect(route).toContain("clearOwnLearnerDefaultResume(context)");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain("createPrivateReadGrant({");
  expect(service).toContain("verifyPrivateDocumentReceipt(evidence)");
  expect(service).toContain("resumeObjectPath:null,resumeScanStatus:null,resumeVerifiedAt:null");
  expect(picker).toContain("Clear default resume");
  expect(picker).toContain("viewResume(item.id)");
  expect(workspace).toContain("Use the Default resume section below to upload a private scanned PDF");
  expect(workspace).not.toContain("Upload/import/remove remains explicitly blocked");
 });
 it("loads a scoped education catalog and maintains editable free-text institution and exam values",()=>{
  const catalog=read("src/modules/people/learner-profile-education-catalog-service.ts");
  const route=read("src/app/api/profile/me/education-config/route.ts");
  const editor=read("src/components/profile/learner-profile-workspace.tsx");
  expect(catalog).toContain("requireOwnLearnerProfileAccess(context)");
  expect(catalog).toContain('eq(colleges.organizationId,membership.organizationId)');
  expect(catalog).toContain('eq(colleges.status,"ACTIVE")');
  expect(catalog).toContain(".limit(25)");
  expect(route).toContain("getOwnLearnerEducationCatalog(");
  expect(route).toContain('"Cache-Control":"private, no-store"');
  expect(editor).toContain("/api/profile/me/education-config?q=");
  expect(editor).toContain("choices.educationTypes");
  expect(editor).toContain("choices.programs");
  expect(editor).toContain("choices.gradingTypes");
  expect(editor).toContain("choices.exams");
  expect(editor).toContain("institutionSuggestions");
  expect(editor).toContain("You can still type the institution, program and exam names");
 });
 it("does not conflate unknown alert blast radius with zero and preserves evidence provenance",()=>{
  const admin=read("src/modules/log-alerts/admin-service.ts");
  const academic=read("src/app/(authenticated)/learn/profile/academic-record/page.tsx");
  expect(admin).toContain("distinctAccountCount: countBySignature.get(row.id) ?? null");
  expect(academic).toContain('evidence?.source === "VERIFIED"');
  expect(academic).toContain("undergraduatePercentage");
  expect(academic).toContain('value===null||!Number.isFinite(value) ? "Not recorded"');
 });
});
