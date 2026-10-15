import {describe,it,expect} from "vitest";
import {platformBroadcastAudience,platformBroadcastSchema} from "@/modules/announcements/platform-broadcast-model";
describe("42 platform announcements",()=>{
 it("distinguishes explicit selected colleges from all",()=>{expect(platformBroadcastAudience([]).mode).toBe("ALL_COLLEGES");expect(platformBroadcastAudience(["a","a"]).collegeIds).toEqual(["a"]);});
 it("rejects unsafe links and unknown targeting parameters",()=>{const base={title:"Notice",message:"Update",link:"javascript:alert(1)",showUntil:new Date().toISOString(),collegeIds:[]};expect(platformBroadcastSchema.safeParse(base).success).toBe(false);expect(platformBroadcastSchema.safeParse({...base,link:"https://example.com",organizationId:"foreign"}).success).toBe(false);});
});
