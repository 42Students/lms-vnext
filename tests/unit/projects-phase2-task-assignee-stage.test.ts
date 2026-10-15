import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const schema = readFileSync(new URL("../../src/db/schema/projects.ts", import.meta.url), "utf8");
const ddl = readFileSync(new URL("../../drizzle/0082_project_task_assignee.sql", import.meta.url), "utf8");

describe("PR-S2-03 task assignee registered schema", () => {
  it("registers a nullable membership FK and partial index (migration 0082)", () => {
    expect(schema).toContain('uuid("assignee_membership_id")');
    expect(ddl).toContain('REFERENCES "public"."college_memberships"("id")');
    expect(ddl).toContain('WHERE "project_tasks"."assignee_membership_id" is not null');
  });
});
