import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("UX-kit-E2E-01 browser fixture cannot expose a production-only test endpoint",()=>{
  it("UI harness is dev-only and interactive module keeps client directive first",()=>{
    const page=readFileSync(join(process.cwd(),"src/app/e2e/chat17-ui-kit/page.tsx"),"utf8");
    const component=readFileSync(join(process.cwd(),"src/app/e2e/chat17-ui-kit/ui-harness.tsx"),"utf8");
    expect(page).toContain('process.env.NODE_ENV !== "development"');
    expect(page).toContain("notFound()");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(component.startsWith('"use client";')).toBe(true);
    for(const exported of [
      "ToastProvider","Dialog","DataTable","ConfirmDialog","Drawer","BottomSheet","ScrollCue","Tabs","FilterBar","FileUpload","Skeleton","Disclosure",
    ])expect(component).toContain(exported);
  });
});
