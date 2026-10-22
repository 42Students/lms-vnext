import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(
  "src/components/admin/super-admin-student-bulk-access.tsx", "utf8",
);

describe("Super Admin student bulk access review", () => {
  it("preserves cross-page selection and membership-scoped membership IDs", () => {
    expect(source).toContain('const storageKey="lms-vnext:student-bulk:"+collegeId;');
    expect(source).toContain("window.sessionStorage.getItem(storageKey)");
    expect(source).toContain("window.sessionStorage.setItem(storageKey,JSON.stringify(selected))");
    expect(source).toContain("const membershipIds=[...selected]");
    expect(source).toContain("setSelected(curr=>curr.filter(id=>!confirmedIds.has(id)))");
  });

  it("uses the accessible confirmation dialog instead of a native browser prompt", () => {
    expect(source).toContain('import { ConfirmDialog } from "@/components/ui/confirm-dialog";');
    expect(source).toContain('onClick={()=>setConfirmOpen(true)}');
    expect(source).toContain('<ConfirmDialog open={confirmOpen}');
    expect(source).toContain('confirmDisabled={busy||selected.length===0}');
    expect(source).toContain('confirmVariant={action==="DISABLE"?"danger":"primary"}');
    expect(source).toContain('onConfirm={()=>void submit()}');
    expect(source).not.toMatch(/\b(?:window\.)?confirm\s*\(/);
  });

  it("retains failed IDs and explains committed groups before confirmation", () => {
    expect(source).toContain("Each group of 25 is atomic.");
    expect(source).toContain("Earlier confirmed groups remain saved");
    expect(source).toContain("Failed and unprocessed students stay selected");
    expect(source).toContain("if(data.requested===ids.length&&data.applied===ids.length&&");
    expect(source).toContain("retainOnlyUnconfirmed()");
  });
});
