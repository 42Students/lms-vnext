import {describe,it,expect} from "vitest";
import {superAdminCollegeBroadcastSchema,sameReviewedBroadcastAudience as match} from "@/modules/announcements/super-admin-college-broadcast-model";
const a="123e4567-e89b-42d3-a456-426614174000",b="123e4567-e89b-42d3-a456-426614174001";
describe("reviewed college set",()=>{
 it("is order independent but cannot be expanded",()=>{
  expect(match([a,b],[b,a])).toBe(true);
  expect(match([a],[a,b])).toBe(false);
  expect(match([a,b],[a])).toBe(false);
  expect(match([a,a],[a,b])).toBe(false);
 });
 it("validates distinct review IDs",()=>{
  const original={audienceMode:"ALL_COLLEGES",collegeIds:[],reviewedCollegeIds:[a,b],title:"Notice",message:"Hello",scheduledAt:null,expiresAt:null,isPinned:false,publishConsent:true};
  expect(superAdminCollegeBroadcastSchema.safeParse(original).success).toBe(true);
  expect(superAdminCollegeBroadcastSchema.safeParse({...original,reviewedCollegeIds:[a,a]}).success).toBe(false);
 });
});
