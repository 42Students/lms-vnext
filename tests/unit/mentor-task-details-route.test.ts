import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Mentor task details route protection",()=>{
  it("requires same-origin PATCH; delegates to scoped service, not an unscoped table update",()=>{
    const source=readFileSync(resolve(process.cwd(),
      "src/app/api/projects/[projectId]/tasks/[taskId]/details/route.ts"),"utf8");
    expect(source).toMatch(/isSameOriginRequest\(request\)|from "@\/security\/route"/);
    expect(source).toContain("updateMentorTaskDetails(context,path,raw)");
    expect(source).not.toMatch(/export (?:async function|const) POST\b/);
    expect(source).not.toMatch(/export (?:async function|const) PUT\b/);
  });
});
