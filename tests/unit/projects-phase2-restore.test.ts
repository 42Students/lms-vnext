import {describe,it,expect} from "vitest";
import {restoreProjectInstanceInputSchema,restoredProjectStatus} from "@/modules/projects/instance-restore-model";
import {readFileSync} from "node:fs";
const service=readFileSync(new URL("../../src/modules/projects/instance-restore-service.ts",import.meta.url),"utf8");
const route=readFileSync(new URL("../../src/app/api/projects/[projectId]/restore/route.ts",import.meta.url),"utf8");
describe("PR-S2-10 archived project restore",()=>{
  it("accepts only timestamp-bound restoration",()=>{
    expect(restoreProjectInstanceInputSchema.safeParse({expectedUpdatedAt:"2026-10-16T01:30:00+05:30"}).success).toBe(true);
    expect(restoreProjectInstanceInputSchema.safeParse({}).success).toBe(false);
    expect(restoredProjectStatus("ACTIVE")).toBe("ACTIVE");
    expect(restoredProjectStatus("COMPLETED")).toBe("COMPLETED");
    expect(restoredProjectStatus("BAD")).toBe("PLANNED");
  });
  it("requires a persisted current primary mentor and a locked archived row",()=>{
    expect(service).toContain('eq(projectMembers.isPrimary,true)');
    expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
    expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
    expect(service).toContain('eq(projectInstances.status,"ARCHIVED")');
    expect(service).toContain("PROJECTS_PROJECT_RESTORED");
    expect(route).toContain("isSameOriginRequest(request)");
  });
});
