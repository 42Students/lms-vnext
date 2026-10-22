import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {legacyAdminProjectStatus} from "@/modules/projects/admin-projects-query-model";

describe("Super Admin legacy project labels retain lifecycle and blockers",()=>{
 it("translates legacy statuses without inventing a BLOCKED database state",()=>{
  expect(legacyAdminProjectStatus("IN_PROGRESS",null)).toBe("In progress");
  expect(legacyAdminProjectStatus("NOT_STARTED",null)).toBe("Not started");
  expect(legacyAdminProjectStatus("DONE",null)).toBe("Completed");
  expect(legacyAdminProjectStatus("ACTIVE","Active blocker")).toBe("Blocked");
  expect(legacyAdminProjectStatus("PLANNED",null)).toBe("Not started");
  expect(legacyAdminProjectStatus("COMPLETED",null)).toBe("Completed");
 });
 it("uses legacy labels only for Super Admin while keeping college workspace labels",()=>{
  const src=readFileSync("src/components/projects/project-admin-workspace-list.tsx","utf8");
  expect(src).toContain('basePath.startsWith("/admin/")');
  expect(src).toContain('legacyAdminProjectStatus(item.status,blocker)');
  expect(src).toContain('collegeWorkspaceStatusLabel(item.status,item.riskReasons)');
  expect(src).toContain('item.riskReasons?.includes("Active blocker")');
  expect(src.match(/workspaceStatus\(item,basePath\)/g)?.length).toBe(3);
 });
});
