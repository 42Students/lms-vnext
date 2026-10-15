import {describe,it,expect} from "vitest";
import {superAdminCollegeBroadcastSchema,requestedBroadcastCollegeIds,broadcastConsentSummary} from "@/modules/announcements/super-admin-college-broadcast-model";
const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
const base={audienceMode:"SELECTED_COLLEGES",collegeIds:[id],title:"Policy",message:"Read this",scheduledAt:null,expiresAt:null,isPinned:false,publishConsent:true};
describe("Super Admin DB10 college notice broadcast contract",()=>{
 it("requires explicit consent and exact audience mode",()=>{
  expect(superAdminCollegeBroadcastSchema.safeParse(base).success).toBe(true);
  expect(superAdminCollegeBroadcastSchema.safeParse({...base,publishConsent:false}).success).toBe(false);
  expect(superAdminCollegeBroadcastSchema.safeParse({...base,collegeIds:[]}).success).toBe(false);
  expect(superAdminCollegeBroadcastSchema.safeParse({...base,audienceMode:"ALL_COLLEGES"}).success).toBe(false);
  expect(superAdminCollegeBroadcastSchema.safeParse({...base,audienceMode:"ALL_COLLEGES",collegeIds:[]}).success).toBe(true);
 });
 it("deduplicates before server count and records disclosure text",()=>{
  expect(requestedBroadcastCollegeIds([id,id])).toEqual([id]);
  expect(broadcastConsentSummary("SELECTED_COLLEGES",1,false)).toContain("1 college");
 });
});