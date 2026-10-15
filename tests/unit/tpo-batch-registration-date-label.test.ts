import {it,expect} from "vitest";
import {tpoRegistrationRecordedAtLabel,tpoRegistrationDaysSince} from "@/modules/placements/tpo-batch-registration-date-label-model";
it("formats recorded timestamps in IST and keeps missing evidence explicit",()=>{
 expect(tpoRegistrationRecordedAtLabel(null)).toBe("No recorded registration update");
 expect(tpoRegistrationRecordedAtLabel("invalid")).toBe("Recorded update time unavailable");
 expect(tpoRegistrationRecordedAtLabel("2026-10-15T10:00:00Z")).toContain("IST");
});
it("uses one server clock and rejects future timestamp ages",()=>{
 const now=new Date("2026-10-15T10:00:00Z");
 expect(tpoRegistrationDaysSince("2026-10-12T10:00:00Z",now)).toBe(3);
 expect(tpoRegistrationDaysSince("2026-10-16T10:00:00Z",now)).toBeNull();
});
