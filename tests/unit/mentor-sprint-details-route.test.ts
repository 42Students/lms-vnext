import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source=readFileSync(join(process.cwd(),
  "src/app/api/projects/[projectId]/sprints/[sprintId]/route.ts"),"utf8");

describe("Mentor sprint edit route authorization contract",()=>{
  it("requires same-origin before resolving the authenticated actor or body",()=>{
    // route() answers INVALID_ORIGIN, then authenticates, before the handler reads any body.
    expect(source).toContain('from "@/security/route"');
    expect(source).toMatch(/export const PATCH = route\(\s*\{ auth: "user"/);
    expect(source).not.toContain("secured(");
    expect(source.indexOf("readMentorProjectCommandBody(request)")).toBeGreaterThan(source.indexOf("= route("));
    expect(source).toContain("updateMentorSprintDetails(context,path,body)");
  });
});
