import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("UX-UNOWNED-TPO-03 built-in job type settings work in mobile WebViews",()=>{
  it("keeps existing labels and idempotent server guards while using an accessible shared confirmation",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/tpo/tpo-builtin-job-types-editor.tsx"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('import {useConfirmFlow} from "@/components/ui/use-confirm-flow"');
    expect(source).toContain('const {askConfirm,dialog}=useConfirmFlow()');
    expect(source).toContain("{dialog}");
    expect(source).toContain('await askConfirm((active?"Show ":"Hide ")+label');
    expect(source).not.toContain("window.confirm(");
    expect(source).toContain("if(busy ||");
    expect(source).toContain('"/api/placements/tpo/settings/job-types/builtin"');
    expect(source).toContain('method:"PATCH"');
    expect(source).toContain('expectedVersion');
    expect(source).toContain("TPO_SETTINGS_STALE");
    expect(source).toContain("TPO_JOB_TYPE_LAST_ACTIVE");
    expect(source).toContain("activeCount<=1");
    expect(source).toContain('caption="Built-in job types"');
    expect(source).toContain('Internship never counts as placed');
  });
});
