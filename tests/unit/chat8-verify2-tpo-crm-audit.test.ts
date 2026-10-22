import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("legacy recruiter CRM audit source parity", () => {
  const src = readFileSync("src/modules/placements/tpo-audit-service.ts", "utf8");
  it("includes persisted DB09 recruiter activity without private contact notes", () => {
    expect(src).toContain('placementTableExists("placement_tpo_lead_activities")');
    expect(src).toContain('placementTableExists("placement_tpo_leads")');
    expect(src).toContain('if (leadActivitiesAvailable)');
    expect(src).toContain('from placement_tpo_lead_activities event');
    expect(src).toContain('lead.college_id = event.college_id');
    expect(src).toContain('where event.college_id = ${collegeId}');
    expect(src).toContain("'placement_recruiter_lead'::text as subject_type");
    expect(src).toContain('event.created_by_user_id as actor_user_id');
    const arm = src.slice(src.indexOf("if (leadActivitiesAvailable)"),
      src.indexOf("if (shareAvailable)"));
    expect(arm).not.toContain("event.note");
    expect(arm).not.toContain("lead.email");
    expect(arm).not.toContain("lead.phone");
    expect(arm).not.toContain("invite_token");
  });
});
