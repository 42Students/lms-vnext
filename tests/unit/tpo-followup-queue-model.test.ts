import { describe, expect, it } from "vitest";
import {
  confirmedTpoFollowupCreateSchema,
  confirmedTpoFollowupDoneSchema,
  projectTpoFollowupQueue,
  tpoFollowupCreatedAudit,
  tpoFollowupDoneAudit,
} from "@/modules/placements/tpo-followup-queue-model";

const uuid = "00000000-0000-4000-8000-000000000001";

describe("DB09 audited TPO follow-up model", () => {
  it("requires confirmed, scoped and bounded creation input", () => {
    const request = {
      confirmed: true, leadId: uuid, dueAt: "2026-12-18T10:00:00+05:30",
      note: "Call recruiter",
    };
    expect(confirmedTpoFollowupCreateSchema.safeParse(request).success).toBe(true);
    expect(confirmedTpoFollowupCreateSchema.safeParse({
      ...request, confirmed: false,
    }).success).toBe(false);
    expect(confirmedTpoFollowupCreateSchema.safeParse({
      ...request, collegeId: uuid,
    }).success).toBe(false);
    expect(confirmedTpoFollowupCreateSchema.safeParse({
      ...request, dueAt: "2026-12-18",
    }).success).toBe(false);
    expect(confirmedTpoFollowupCreateSchema.safeParse({
      ...request, note: "a".repeat(501),
    }).success).toBe(false);
  });

  it("requires explicit completed outcome, note and expected date snapshot", () => {
    const request = {
      confirmed: true,
      expectedDueAt: "2026-12-18T04:30:00.000Z",
      outcome: "CONTACTED",
      note: "Recruiter confirmed the follow-up",
    };
    expect(confirmedTpoFollowupDoneSchema.safeParse(request).success).toBe(true);
    expect(confirmedTpoFollowupDoneSchema.safeParse({
      ...request, confirmed: false,
    }).success).toBe(false);
    expect(confirmedTpoFollowupDoneSchema.safeParse({
      ...request, outcome: "CONVERTED",
    }).success).toBe(false);
    expect(confirmedTpoFollowupDoneSchema.safeParse({
      ...request, note: "",
    }).success).toBe(false);
    expect(confirmedTpoFollowupDoneSchema.safeParse({
      ...request, collegeId: uuid,
    }).success).toBe(false);
  });

  it("projects actual stored due rows without fabricating contact state", () => {
    const result = projectTpoFollowupQueue([
      {
        id: uuid, leadId: uuid, leadName: "Recruiter",
        companyName: null, dueAt: new Date("2026-12-18T04:30:00Z"),
        note: null,
      },
    ], new Date("2026-12-18T05:00:00Z"));
    expect(result).toEqual({
      dueCount: 1,
      rows: [{
        id: uuid, leadId: uuid, leadName: "Recruiter",
        companyName: null, dueAt: "2026-12-18T04:30:00.000Z",
        note: null, phoneNorm: null, canContact: true, overdue: true,
      }],
    });
    expect(projectTpoFollowupQueue([], new Date()).rows).toEqual([]);
  });

  it("audit summaries are deterministic and bounded", () => {
    expect(tpoFollowupCreatedAudit(new Date("2026-12-18T04:30:00Z")))
      .toBe("Follow-up scheduled for 2026-12-18T04:30:00.000Z");
    expect(tpoFollowupDoneAudit("CONTACTED", "Call completed"))
      .toBe("Follow-up completed (CONTACTED): Call completed");
  });
});
