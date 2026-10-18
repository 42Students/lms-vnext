import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { safeProjectProgressPercent } from "@/components/projects/project-admin-workspace-list";

describe("UX-project-workspaces-41/42 accessible workspace cards",()=>{
  it("UX-project-workspaces-41 primary navigation retains minimum 44px target",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/projects/project-admin-workspace-list.tsx"),"utf8");
    expect(source).toContain("Open workspace");
    expect(source).not.toContain("min-h-9");
    expect(source).toContain("min-h-11");
  });
  it("UX-project-workspaces-42 non-finite or outside 0..100 progress is unavailable, not a fake 100%",()=>{
    for(const v of [Number.NaN,Infinity,-Infinity,-1,100.01,100000]){
      expect(safeProjectProgressPercent(v)).toBeNull();
    }
    for(const v of [0,0.5,43,99.9,100]){
      expect(safeProjectProgressPercent(v)).toBe(v);
    }
    const source=readFileSync(join(process.cwd(),
      "src/components/projects/project-admin-workspace-list.tsx"),"utf8");
    expect(source).toContain("Progress unavailable");
    expect(source).toContain("aria-valuenow={progress}");
    expect(source).not.toContain("aria-valuenow={item.progressPercent}");
  });
});
