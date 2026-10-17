import {it,expect} from "vitest";
import {attendancePolicyUpdateSchema} from "@/modules/attendance/policy-validation";
it("SA-tenants-modules-34 honors the legacy 8760-hour correction window and rejects anything beyond it",()=>{
 const collegeId="11111111-1111-4111-8111-111111111111";
 expect(attendancePolicyUpdateSchema.safeParse({collegeId,eligibilityThresholdPercent:75,correctionWindowHours:168}).success).toBe(true);
 expect(attendancePolicyUpdateSchema.safeParse({collegeId,eligibilityThresholdPercent:75,correctionWindowHours:8760}).success).toBe(true);
 expect(attendancePolicyUpdateSchema.safeParse({collegeId,eligibilityThresholdPercent:75,correctionWindowHours:8761}).success).toBe(false);
});
