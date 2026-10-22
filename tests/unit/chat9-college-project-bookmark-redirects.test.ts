import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
describe("legacy College Admin workspace deep-link continuity",()=>{
  const root=join(process.cwd(),"src/app/(authenticated)/college/projects");
  it("redirects stale Workspaces list bookmarks to the canonical list",()=>{
    const src=readFileSync(join(root,"workspaces/page.tsx"),"utf8");
    expect(src).toContain('redirect("/college/projects"+(target.size?"?"+target.toString():""))');
    expect(src).toContain('const target=new URLSearchParams()');
    expect(existsSync(join(root,"page.tsx"))).toBe(true);
  });
  it("preserves workspace ID and section under the canonical scoped route",()=>{
    const old=readFileSync(join(root,"workspaces/[workspaceId]/page.tsx"),"utf8");
    const deep=readFileSync(join(root,"workspaces/[workspaceId]/[section]/page.tsx"),"utf8");
    expect(old).toContain("encodeURIComponent(workspaceId)");
    expect(deep).toContain("encodeURIComponent(workspaceId)");
    expect(deep).toContain("encodeURIComponent(section)");
    expect(existsSync(join(root,"[projectId]/page.tsx"))).toBe(true);
    expect(existsSync(join(root,"[projectId]/[section]/page.tsx"))).toBe(true);
    expect(existsSync(join(root,"workspaces/new/page.tsx"))).toBe(true);
  });
});
