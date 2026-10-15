import {describe,it,expect} from "vitest";
import {canViewProjectResource} from "@/modules/projects/resource-visibility-policy";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../../docs/proposed-migrations/pr-s2-11-resource-visibility.sql",import.meta.url),"utf8");
describe("PR-S2-11 stage mentor-only resource visibility",()=>{
  it("does not disclose mentor-only resources to learners",()=>{
    expect(canViewProjectResource("MENTOR_ONLY","LEARNER")).toBe(false);
    expect(canViewProjectResource("MENTOR_ONLY","MENTOR")).toBe(true);
    expect(canViewProjectResource("MENTOR_ONLY","ADMIN")).toBe(true);
    expect(canViewProjectResource("TEAM","LEARNER")).toBe(true);
  });
  it("backfills existing resources as team-visible",()=>{
    expect(sql).toContain("DEFAULT 'TEAM'");
    expect(sql).toContain("'MENTOR_ONLY'");
    expect(sql).toContain("project_id,visibility");
  });
});
