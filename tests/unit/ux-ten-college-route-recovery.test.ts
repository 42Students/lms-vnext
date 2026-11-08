import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const route=(path:string)=>readFileSync("src/app/(authenticated)/college/"+path,"utf8");
const cases=[
  ["batch-promotion/error.tsx",'href="/college/batches"'],
  ["college-profile/error.tsx",'href="/college/contacts"'],
  ["courses/error.tsx",'href="/college"'],
  ["electives/[slotId]/allocate/error.tsx",'href="/college/electives"'],
  ["groups/error.tsx",'href="/college"'],
  ["lecture-halls/[hallId]/loading.tsx",'href="/college/lecture-halls"'],
  ["placements/jobs/[jobId]/error.tsx",'homeHref="/college/placements"'],
  ["placements/new/error.tsx",'homeHref="/college/placements"'],
  ["projects/error.tsx",'homeHref="/college/projects"'],
  ["projects/audit/error.tsx",'homeHref="/college/projects"'],
] as const;
describe("UX-G030–G040 scoped College Admin recovery",()=>{
  for(const [path,destination] of cases)it("shows safe return: "+path,()=>{
    const code=route(path);
    expect(code).toContain(destination);
    expect(code).not.toContain("error.message");
    expect(code).not.toContain("error.digest");
  });
  it("does not remove College Admin role guard",()=>{
    const code=route("placements/new/page.tsx");
    expect(code).toContain("hasMembershipRole(");
    expect(code).toContain('"COLLEGE_ADMIN"');
    expect(code).toContain('redirect("/dashboard")');
  });
  it("test-only preview is a 404 unless explicitly enabled in development",()=>{
    const code=readFileSync("src/app/e2e/ux-ten-college-recovery/page.tsx","utf8");
    expect(code).toContain('process.env.NODE_ENV!=="development"');
    expect(code).toContain('process.env["UX_TEN_COLLEGE_FIXTURE"]!=="1"');
    expect(code).toContain("notFound()");
  });
});
