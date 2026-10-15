import {describe,expect,it} from "vitest";
import {announcementCreateSchema,announcementUpdateSchema} from "@/modules/announcements/validation";
import {requirePlatformPublishConsent,platformAnnouncementPublicationSummary} from "@/modules/announcements/super-admin-publish-consent-model";
describe("Super Admin DB10 announcement publication consent",()=>{
 it("requires explicit confirmation for the Super Admin actor",()=>{
  expect(()=>requirePlatformPublishConsent(true,false)).toThrow("CONSENT_REQUIRED");
  expect(()=>requirePlatformPublishConsent(true,true)).not.toThrow();
  expect(()=>requirePlatformPublishConsent(false,false)).not.toThrow();
 });
 it("validates the consent field without allowing arbitrary publication flags",()=>{
  const core={receiverType:"COLLEGE",receiverId:"92b172ff-3817-44bf-9b48-e9afab2e93d0",title:"Notice",message:"Message"};
  expect(announcementCreateSchema.safeParse({...core,publishConsent:true}).success).toBe(true);
  expect(announcementCreateSchema.safeParse({...core,publishConsent:false}).success).toBe(false);
 });
 it("shows the exact target and timing before approval",()=>{
  expect(platformAnnouncementPublicationSummary({receiverType:"COLLEGE",receiverLabel:"Engineering",title:"Update",scheduledAt:null,expiresAt:null,isPinned:true})).toContain("Pinned: Yes");
 });
 it("guards Super Admin edit publication fields with explicit approval",()=>{

  expect(announcementUpdateSchema.safeParse({expectedVersion:1,message:"Revised",publishConsent:true}).success).toBe(true);
  expect(announcementUpdateSchema.safeParse({expectedVersion:1,message:"Revised",publishConsent:false}).success).toBe(false);
 });
});
