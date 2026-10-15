import {describe,it,expect} from "vitest";
import {superAdminCollegeBroadcastSchema as schema} from "@/modules/announcements/super-admin-college-broadcast-model";
const college="123e4567-e89b-42d3-a456-426614174000";
const base={audienceMode:"SELECTED_COLLEGES",collegeIds:[college],title:"Notice",message:"Body",scheduledAt:null,expiresAt:null,isPinned:false,publishConsent:true};
describe("DB10 broadcast recipient duplication",()=>{
 it("allows one explicitly selected college",()=>{expect(schema.safeParse(base).success).toBe(true);});
 it("denies duplicate selected IDs even when the target set is in scope",()=>{expect(schema.safeParse({...base,collegeIds:[college,college]}).success).toBe(false);});
 it("denies listed recipients with ALL_COLLEGES",()=>{expect(schema.safeParse({...base,audienceMode:"ALL_COLLEGES"}).success).toBe(false);});
});
