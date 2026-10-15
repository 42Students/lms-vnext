import {expect,it} from "vitest";
import {tpoPlacementRegistrationConsentEvidence,tpoPlacementConsentDescription} from "@/modules/placements/tpo-batch-registration-consent-model";
it("never infers placement consent from choice, source or TPO attribution alone",()=>{
 expect(tpoPlacementRegistrationConsentEvidence({choice:"PLACEMENTS",consentAt:null,consentVersion:"v1"})).toBe("MISSING");
 expect(tpoPlacementRegistrationConsentEvidence({choice:"PLACEMENTS",consentAt:new Date("2026-10-15T00:00:00Z"),consentVersion:"v1"})).toBe("RECORDED");
 expect(tpoPlacementRegistrationConsentEvidence({choice:"HIGHER_STUDIES",consentAt:null,consentVersion:null})).toBe("NOT_APPLICABLE");
 expect(tpoPlacementConsentDescription("RECORDED")).toMatch(/not an external-message opt-in/);
});
