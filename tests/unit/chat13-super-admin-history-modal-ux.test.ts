import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-ADMIN-HISTORY-MODAL-10 accessible college import history",()=>{
  it("restores focus after Close or native Escape, and maintains modal focus trapping",()=>{
    const view=readFileSync("src/components/admin/super-admin-student-import-history.tsx","utf8");
    expect(view).toContain('import { Dialog } from "@/components/ui/dialog"');
    expect(view).toContain('<Dialog open={open} onOpenChange={setOpen} title="Import History"');
    expect(view).toContain('onClick={() => setOpen(true)}');
    expect(view).toContain('footer={<Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Close</Button>}');
    expect(view).toContain('bodyClassName="min-w-0 overflow-y-auto overscroll-contain"');
    expect(view).toContain('aria-label="Bulk import history records"');
    expect(view).toContain('<DataTable caption="Bulk import history records"');
    expect(view).toContain('min-h-11');
  });
  it("uses one vertical modal scroller and leaves horizontal table scrolling to the shared DataTable",()=>{
    const view=readFileSync("src/components/admin/super-admin-student-import-history.tsx","utf8");
    expect(view).toContain('className="max-w-[640px] max-h-[calc(100dvh-2rem)]" bodyClassName="min-w-0 overflow-y-auto overscroll-contain"');
    expect(view).toContain('<Dialog open={open} onOpenChange={setOpen}');
    expect(view).toContain('<div role="region" aria-label="Bulk import history records"');
    expect(view).toContain('min-w-0');
    expect(view).toContain('mobilePriority:"primary"');
    expect(view).toContain('caption="Bulk import history records"');
    expect(view).toContain('No bulk imports on file for this college.');
    expect(view).not.toContain('max-h-[60dvh] overflow-x-auto');
  });
});
