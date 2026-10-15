import { expect, it } from "vitest";
import { RECRUITER_ROUTE_ALIASES, recruiterDriveDetailHref } from "@/modules/placements/recruiter-route-alias-model";
it("exposes canonical recruiter pages", () => {
 expect(RECRUITER_ROUTE_ALIASES.home).toBe("/recruiter/home");
 expect(RECRUITER_ROUTE_ALIASES.newDrive).toBe("/recruiter/drives/new");
 expect(recruiterDriveDetailHref("11111111-1111-4111-8111-111111111111")).toContain("/recruiter/drives/");
 expect(() => recruiterDriveDetailHref("../admin")).toThrow("INVALID_JOB_ID");
});
