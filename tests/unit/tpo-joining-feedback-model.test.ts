import { describe, expect, it } from "vitest";
import {
  projectTpoJoiningTracker,
  tpoJoiningTrackerQuerySchema,
} from "@/modules/placements/tpo-joining-tracker-model";
import {
  projectTpoCompanyFeedback,
  tpoCompanyFeedbackQuerySchema,
  tpoCompanyFeedbackWriteSchema,
} from "@/modules/placements/tpo-company-feedback-model";

const id = "00000000-0000-4000-8000-000000000001";

describe("TPO joining tracker pure projection", () => {
  const candidate = { membershipId: id, displayName: null };
  const issuedAt = new Date("2026-10-01T12:00:00.000Z");
  const source = (idValue: string, status: string, joiningStatus: string | null) => ({
    offer: { id: idValue, status, roleTitle: "Engineer", annualCtcInr: null, issuedAt },
    candidate,
    joining: joiningStatus ? {
      status: joiningStatus, joiningDate: null, reason: null,
    } : null,
  });

  it("does not equate issued offers or missing outcomes with joining", () => {
    const data = projectTpoJoiningTracker([
      source("issued", "ISSUED", null),
      source("pending", "ACCEPTED", null),
      source("joined", "ACCEPTED", "JOINED"),
      source("deferred", "ACCEPTED", "DEFERRED"),
      source("not", "ACCEPTED", "DID_NOT_JOIN"),
    ]);
    expect(data.counts).toEqual({
      accepted: 4, pending: 1, joined: 1, deferred: 1, didNotJoin: 1,
    });
    expect(data.items.map((item) => item.offerId)).not.toContain("issued");
    expect(data.items[0]?.joiningStatus).toBe("PENDING");
    expect(data.items[0]?.hasRecordedOutcome).toBe(false);
    expect(data.items[0]?.displayName).toBe("Unnamed learner");
  });

  it("rejects unexpected college scopes and malformed IDs", () => {
    expect(tpoJoiningTrackerQuerySchema.safeParse({ jobId: id }).success).toBe(true);
    expect(tpoJoiningTrackerQuerySchema.safeParse({ jobId: id, collegeId: id }).success).toBe(false);
    expect(tpoJoiningTrackerQuerySchema.safeParse({ jobId: "broken" }).success).toBe(false);
  });
});

describe("TPO company feedback pure projection and validation", () => {
  it("exposes only recorded internal notes with normalized names and dates", () => {
    const result = projectTpoCompanyFeedback([
      { id, leadId: id, leadName: "  Recruiter A  ", note: "  Interview schedule confirmed  ", at: new Date("2026-10-01T06:00:00Z") },
      { id: "empty", leadId: id, leadName: "B", note: "  ", at: new Date("2026-10-01T06:00:00Z") },
      { id: "null", leadId: id, leadName: "C", note: null, at: new Date("2026-10-01T06:00:00Z") },
    ]);
    expect(result).toEqual([{
      id, leadId: id, contactName: "Recruiter A",
      note: "Interview schedule confirmed",
      recordedAtIso: "2026-10-01T06:00:00.000Z",
    }]);
    expect(Object.keys(result[0]!)).not.toContain("email");
  });

  it("accepts only linked-contact note fields with bounded text", () => {
    expect(tpoCompanyFeedbackWriteSchema.safeParse({ leadId: id, note: "Called recruiter" }).success).toBe(true);
    expect(tpoCompanyFeedbackWriteSchema.safeParse({ leadId: id, note: " " }).success).toBe(false);
    expect(tpoCompanyFeedbackWriteSchema.safeParse({ leadId: id, note: "Valid", collegeId: id }).success).toBe(false);
    expect(tpoCompanyFeedbackWriteSchema.safeParse({ leadId: "not-uuid", note: "Valid" }).success).toBe(false);
    expect(tpoCompanyFeedbackQuerySchema.safeParse({ companyId: id, page: "3" }).success).toBe(true);
    expect(tpoCompanyFeedbackQuerySchema.safeParse({ companyId: id, page: "0" }).success).toBe(false);
  });
});
