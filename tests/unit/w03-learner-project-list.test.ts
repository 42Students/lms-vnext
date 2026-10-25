import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const listPage = readFileSync(
  join(root, "src/app/(authenticated)/learn/projects/page.tsx"),
  "utf8",
);
const detailPage = readFileSync(
  join(root, "src/app/(authenticated)/learn/projects/[projectId]/page.tsx"),
  "utf8",
);
const service = readFileSync(
  join(root, "src/modules/projects/learner-attention-service.ts"),
  "utf8",
);

describe("W03 learner project discovery and attention contract", () => {
  it("keeps search, status, needs-action and pagination addressable", () => {
    for (const token of [
      'params["search"]',
      'params["status"]',
      'params["attention"]',
      'params["page"]',
      'params["pageSize"]',
      "ProjectParticipantPagination",
    ]) {
      expect(listPage).toContain(token);
    }
    expect(listPage).toContain('"LEARNER_ACTION"');
  });

  it("derives needs-action only from the learner's latest persisted final-delivery state", () => {
    expect(service).toContain("listMyProjectInstances");
    expect(service).toContain('"CHANGES_REQUESTED"');
    expect(service).toContain('"DRAFT"');
    expect(service).toContain('row.memberRole === "LEARNER"');
    expect(service).toContain('row.project.status !==');
    expect(service).toContain('"ARCHIVED"');
  });

  it("deep-links actionable delivery cards to the delivery workspace section", () => {
    expect(listPage).toContain('"?tab=delivery"');
    expect(detailPage).toContain('tab === "delivery"');
    expect(detailPage).toContain('? "delivery"');
  });

  it("does not fabricate the missing workspace blocker signal", () => {
    // Blocked is derived only from persisted task blockers (migration 0090), never inferred
    // from unrelated task states, and the old developer-facing note is no longer rendered.
    expect(listPage).toContain("learnerProjectHasBlockedTasks");
    expect(listPage).not.toContain("does not yet persist that blocker field");
  });
});
