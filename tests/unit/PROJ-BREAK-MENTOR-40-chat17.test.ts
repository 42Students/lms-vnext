import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source=()=>readFileSync(join(process.cwd(),"src/components/projects/mentor-task-allocation.tsx"),"utf8");

describe("PROJ-BREAK-MENTOR-40 auto-allocation confirmation and accessibility",()=>{
  it("PROJ-BREAK-MENTOR-40a requires affirmative shared confirmation before assignment POST",()=>{
    const code=source();
    expect(code.startsWith('"use client";')).toBe(true);
    expect(code).toContain('import {useConfirmFlow} from "@/components/ui/use-confirm-flow"');
    expect(code).toContain('const {askConfirm,dialog}=useConfirmFlow()');
    expect(code).toContain("{dialog}");
    const affirmative=code.indexOf('await askConfirm("Auto-assign unassigned tasks');
    const mutation=code.indexOf('"/tasks/auto-assign","POST"');
    expect(affirmative).toBeGreaterThan(0);
    expect(mutation).toBeGreaterThan(affirmative);
    expect(code).toContain("setBusy(true)");
    expect(code).toContain("disabled={busy||projectUnassigned===0||!learners.length}");
    expect(code).not.toContain("window.confirm(");
    expect(code).not.toContain("window.alert(");
  });

  it("PROJ-BREAK-MENTOR-40b all buttons and selectors expose >=44px targets and remain read-only gated",()=>{
    const code=source();
    expect(code).not.toContain("min-h-10");
    expect(code).toContain("min-h-11");
    expect(code).toContain("readOnly");
    expect(code).toContain("task.assigneeMembershipId===membershipId");
    expect(code).toContain('"DONE","IN_REVIEW"');
    expect(code).toContain("expectedUpdatedAt:");
  });
});
