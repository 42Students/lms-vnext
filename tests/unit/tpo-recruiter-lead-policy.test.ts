import { describe, expect, it } from "vitest";
import {
  deriveTpoRecruiterInviteStatus,
  deriveTpoRecruiterLeadStage,
  inferLegacyRecruiterCompanyName,
} from "@/modules/placements/tpo-recruiter-lead-policy";

describe("W05 legacy recruiter lead policy", () => {
  const invitedAt = new Date("2026-10-10T06:30:00.000Z");

  it("preserves exact derived-stage precedence", () => {
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "NOT_NOW", hasRecruitedFact: true, hasPlannedDriveFact: true,
      recruiterUserId: "r1", inviteSentAt: invitedAt,
    })).toBe("NOT_NOW");
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "CONTACTED", hasRecruitedFact: true, hasPlannedDriveFact: true,
      recruiterUserId: "r1", inviteSentAt: invitedAt,
    })).toBe("RECRUITED");
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "CONTACTED", hasRecruitedFact: false, hasPlannedDriveFact: true,
      recruiterUserId: "r1", inviteSentAt: invitedAt,
    })).toBe("DRIVE_PLANNED");
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "CONTACTED", hasRecruitedFact: false, hasPlannedDriveFact: false,
      recruiterUserId: "r1", inviteSentAt: invitedAt,
    })).toBe("JOINED");
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "CONTACTED", hasRecruitedFact: false, hasPlannedDriveFact: false,
      recruiterUserId: null, inviteSentAt: invitedAt,
    })).toBe("INVITED");
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "CONTACTED", hasRecruitedFact: false, hasPlannedDriveFact: false,
      recruiterUserId: null, inviteSentAt: null,
    })).toBe("CONTACTED");
    expect(deriveTpoRecruiterLeadStage({
      manualStage: "NEW", hasRecruitedFact: false, hasPlannedDriveFact: false,
      recruiterUserId: null, inviteSentAt: null,
    })).toBe("NEW");
  });

  it("preserves invite-status precedence", () => {
    expect(deriveTpoRecruiterInviteStatus({
      recruiterUserId: "r1", inviteSentAt: invitedAt, inviteClickedAt: invitedAt, inviteBouncedAt: invitedAt,
    })).toBe("JOINED");
    expect(deriveTpoRecruiterInviteStatus({
      recruiterUserId: null, inviteSentAt: invitedAt, inviteClickedAt: invitedAt, inviteBouncedAt: invitedAt,
    })).toBe("BOUNCED");
    expect(deriveTpoRecruiterInviteStatus({
      recruiterUserId: null, inviteSentAt: invitedAt, inviteClickedAt: invitedAt, inviteBouncedAt: null,
    })).toBe("CLICKED");
    expect(deriveTpoRecruiterInviteStatus({
      recruiterUserId: null, inviteSentAt: invitedAt, inviteClickedAt: null, inviteBouncedAt: null,
    })).toBe("SENT");
    expect(deriveTpoRecruiterInviteStatus({
      recruiterUserId: null, inviteSentAt: null, inviteClickedAt: null, inviteBouncedAt: null,
    })).toBe("NOT_SENT");
  });

  it("infers company only from a non-free work email", () => {
    expect(inferLegacyRecruiterCompanyName("person@acme.com")).toBe("Acme");
    expect(inferLegacyRecruiterCompanyName("person@Foo-Bar.co.in")).toBe("Foo-bar");
    expect(inferLegacyRecruiterCompanyName("person@gmail.com")).toBeNull();
    expect(inferLegacyRecruiterCompanyName("person@outlook.com")).toBeNull();
    expect(inferLegacyRecruiterCompanyName(null)).toBeNull();
  });
});
