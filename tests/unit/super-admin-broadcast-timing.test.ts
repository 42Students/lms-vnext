import {describe,it,expect} from "vitest";
import {broadcastLocalTiming} from "@/modules/announcements/super-admin-broadcast-timing-model";
describe("Super Admin broadcast local timing",()=>{
 it("supports immediate notices",()=>{expect(broadcastLocalTiming("","")).toEqual({valid:true,scheduledAt:null,expiresAt:null});});
 it("rejects malformed schedule",()=>{expect(broadcastLocalTiming("not a date","").valid).toBe(false);});
 it("rejects malformed expiry",()=>{expect(broadcastLocalTiming("","broken").valid).toBe(false);});
 it("rejects expiry equal to schedule",()=>{expect(broadcastLocalTiming("2026-11-01T10:00","2026-11-01T10:00").valid).toBe(false);});
 it("rejects expiry before schedule",()=>{expect(broadcastLocalTiming("2026-11-01T11:00","2026-11-01T10:00").valid).toBe(false);});
 it("normalizes a valid window to UTC",()=>{const timing=broadcastLocalTiming("2026-11-01T10:00","2026-11-01T11:00");expect(timing.valid).toBe(true);expect(timing.scheduledAt).toMatch(/Z$/);});
});
