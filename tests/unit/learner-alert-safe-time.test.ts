import {expect,it} from "vitest";
import {learnerAlertSafeDate} from "@/modules/placements/learner-alert-safe-date-model";
it("formats valid alerts in IST and refuses to serialize invalid saved dates",()=>{
 const valid=learnerAlertSafeDate(new Date("2026-10-15T00:00:00Z"));
 expect(valid.iso).toBe("2026-10-15T00:00:00.000Z");
 expect(valid.label).toContain("IST");
 expect(learnerAlertSafeDate(new Date("bad"))).toEqual({iso:null,label:"Date unavailable"});
});
