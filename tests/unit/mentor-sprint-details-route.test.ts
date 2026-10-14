import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source=readFileSync(join(process.cwd(),
  "src/app/api/projects/[projectId]/sprints/[sprintId]/route.ts"),"utf8");

describe("Mentor sprint edit route authorization contract",()=>{
  it("requires same-origin before resolving the authenticated actor or body",()=>{
    expect(source).toContain("isSameOriginRequest(request)");
    expect(source).toContain('error:"INVALID_ORIGIN"');
    const origin=source.indexOf("isSameOriginRequest(request)");
    const auth=source.indexOf("getCurrentRequestContext()");
    expect(origin).toBeGreaterThan(-1);
    expect(auth).toBeGreaterThan(origin);
    expect(source).toContain("updateMentorSprintDetails(context,path,body)");
  });
});
