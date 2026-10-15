import {describe,it,expect} from "vitest";
import {announcementLocalTiming} from "@/modules/announcements/local-timing-model";
describe("announcement composer local schedule preflight",()=>{
 it("does not require a schedule for immediate delivery",()=>expect(announcementLocalTiming("","").valid).toBe(true));
 it("blocks invalid date values instead of publishing without a schedule",()=>expect(announcementLocalTiming("bad","").valid).toBe(false));
 it("blocks invalid expiry values instead of silently dropping the expiry",()=>expect(announcementLocalTiming("","bad").valid).toBe(false));
 it("blocks out-of-order windows",()=>expect(announcementLocalTiming("2026-11-15T15:00","2026-11-15T14:59").valid).toBe(false));
 it("accepts a future ordered window",()=>expect(announcementLocalTiming("2026-11-15T15:00","2026-11-15T16:00").valid).toBe(true));
});
