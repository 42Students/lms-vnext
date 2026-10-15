import {describe,expect,it} from "vitest";
import {collegeVerificationLegacyCopy} from "@/modules/verification/college-legacy-verification-copy";
describe("verbatim College Admin verification page copy",()=>{
  it("matches the legacy page title and subtitle exactly",()=>{
    expect(collegeVerificationLegacyCopy.title).toBe("Profile verification");
    expect(collegeVerificationLegacyCopy.subtitle).toBe(
      "Check each student's education and identity against their documents. Verified profiles are what companies and the placement cell rely on.",
    );
  });
  it("distinguishes an actually empty Waiting tab from decided tabs",()=>{
    expect(collegeVerificationLegacyCopy.emptyWaiting).toBe("Nobody is waiting");
    expect(collegeVerificationLegacyCopy.emptyDecided).toBe("Nothing here yet");
    expect(collegeVerificationLegacyCopy.emptyDescription).toBe(
      "Students appear here when they send their education or identity.",
    );
  });
});
