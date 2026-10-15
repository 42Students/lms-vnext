import { describe, expect, it } from "vitest";
import { RECRUITER_PAGE_COPY } from "@/modules/placements/recruiter-page-copy";

import { RECRUITER_REQUEST_DRIVE_HREF } from "@/modules/placements/recruiter-page-copy";

describe("Owner-approved Recruiter page copy", () => {
 it("matches the specified sidebar role, page headings and CTA", () => {
   expect(RECRUITER_PAGE_COPY).toEqual({
     role: "Recruiter",
     drives: "Drives",
     calendar: "Recruiter Calendar",
     messages: "Messages & Notifications",
     profile: "Your Profile",
     requestDrive: "Request a drive",
   });
 });
 it("keeps Request a drive reachable in the recruiter top bar", () => {
   expect(RECRUITER_REQUEST_DRIVE_HREF).toBe("/hr/drives/new");
 });
});
