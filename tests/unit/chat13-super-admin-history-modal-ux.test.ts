import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-ADMIN-HISTORY-MODAL-10 accessible college import history",()=>{
  it("restores focus after Close or native Escape, and maintains modal focus trapping",()=>{
    const view=readFileSync("src/components/admin/super-admin-student-import-history.tsx","utf8");
    expect(view).toContain("const dialogRef=useRef<HTMLDialogElement>(null)");
    expect(view).toContain("const triggerRef=useRef<HTMLButtonElement>(null)");
    expect(view).toContain('ref={triggerRef} type="button"');
    expect(view).toContain('dialogRef.current?.showModal()');
    expect(view).toContain('onClose={()=>triggerRef.current?.focus()}');
    expect(view).toContain('aria-label="Bulk import history"');
    expect(view).toContain('dialogRef.current?.close()');
    expect(view).toContain('min-h-11');
  });
  it("uses one vertical modal scroller and leaves horizontal table scrolling to the shared DataTable",()=>{
    const view=readFileSync("src/components/admin/super-admin-student-import-history.tsx","utf8");
    expect(view).toContain('max-h-[calc(100dvh-2rem)] overflow-hidden');
    expect(view).toContain('[&[open]]:flex [&[open]]:flex-col');
    expect(view).toContain('min-h-0 flex-1 overflow-y-auto overflow-x-hidden');
    expect(view).toContain('overscroll-contain');
    expect(view).toContain('[mask-image:linear-gradient(to_bottom,black_92%,transparent_100%)]');
    expect(view).toContain('caption="Bulk import history records"');
    expect(view).toContain('No bulk imports on file for this college.');
    expect(view).not.toContain('max-h-[60dvh] overflow-x-auto');
  });
});
