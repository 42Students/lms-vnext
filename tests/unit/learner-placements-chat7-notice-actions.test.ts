import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { learnerPlacementNoticeFeed, safeLearnerNoticeAction } from "@/modules/placements/learner-placement-announcement-model";
const source = (path: string) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("Chat-7 learner notice action and audience parity", () => {
  it("LEARNER-placements-47 renders only safe persisted TPO action links", () => {
    const base = {
      id: "notice-1", title: "Interview prep", message: "Prepare early",
      createdAt: new Date("2099-01-01T00:00:00Z"), isPinned: false,
      senderType: "TPO", receiverType: "COLLEGE",
      buttonLabel: "View preparation", buttonUrl: "https://example.edu/prep",
    };
    expect(learnerPlacementNoticeFeed([base])[0]).toMatchObject({
      buttonLabel: "View preparation", buttonUrl: "https://example.edu/prep",
      senderLabel: "Placement cell", audienceLabel: "College",
    });
    expect(safeLearnerNoticeAction("View", "javascript:alert(1)")).toBeNull();
    expect(safeLearnerNoticeAction("View", "http://example.edu/prep")).toBeNull();
    expect(safeLearnerNoticeAction("", "https://example.edu/prep")).toBeNull();
    expect(learnerPlacementNoticeFeed([{ ...base, buttonUrl: "data:text/html,unsafe" }])[0]).not.toHaveProperty("buttonUrl");
    const page = source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
    expect(page).toContain("notice.buttonUrl && notice.buttonLabel");
    expect(page).toContain('rel="noopener noreferrer"');
  });

  it("LEARNER-placements-49 preserves scoped TPO producer to learner reader wiring", () => {
    const producer = source("src/modules/announcements/tpo-placement-write-service.ts");
    const consumer = source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
    const reader = source("src/modules/announcements/service.ts");
    expect(producer).toContain("buttonUrl:data.buttonUrl??null");
    expect(producer).toContain('senderType:"TPO"');
    expect(reader).toContain("listVisibleAnnouncementsForMembership(");
    expect(consumer).toContain("listVisibleAnnouncementsForMembership(context)");
    expect(consumer).not.toContain("a dedicated placement-only publisher is not yet registered");
  });

  it("LEARNER-placements-R08 prevents discovery outside assigned cohort or section", () => {
    const service = source("src/modules/placements/learner-job-service.ts");
    expect(service).toContain("const targetedRows = rows.filter(");
    expect(service).toContain("isPlacementJobTargetCohort(");
    expect(service).toContain("isPlacementJobTargetSection(");
    expect(service).toContain("targetedRows.map(async");
  });
});
