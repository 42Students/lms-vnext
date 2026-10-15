import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const stage = readFileSync(new URL("../../src/modules/projects/staged-schema.ts", import.meta.url), "utf8");
const ddl = readFileSync(new URL("../../docs/proposed-migrations/pr-s2-03-task-assignee.sql", import.meta.url), "utf8");

describe("PR-S2-03 task assignee schema proposal", () => {
  it("stages a nullable membership FK without registering it prematurely", () => {
    expect(stage).toContain('uuid("assignee_membership_id")');
    expect(ddl).toContain("REFERENCES college_memberships(id)");
    expect(ddl).toContain("WHERE assignee_membership_id IS NOT NULL");
    expect(ddl).toContain("only to an active LEARNER project member");
  });
});
