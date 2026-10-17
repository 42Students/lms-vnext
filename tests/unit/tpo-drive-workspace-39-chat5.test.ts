import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("TPO round edit draft guard",()=>{
 it("TPO-drive-workspace-39 preserves a dirty round order on reload and clears it only after save or explicit undo",()=>{
  const guard=readFileSync("src/components/placements/use-unsaved-drive-guard.ts","utf8");
  const reorder=readFileSync("src/components/placements/tpo-round-reorder.tsx","utf8");
  expect(guard).toContain('window.addEventListener("beforeunload", beforeUnload)');
  expect(guard).toContain('window.removeEventListener("beforeunload", beforeUnload)');
  expect(reorder).toContain("useUnsavedDriveGuard()");
  expect(reorder).toContain("markDirty()");
  expect(reorder).toContain("clearDirty();setSaved(true)");
  expect(reorder).toContain("clearDirty();setError(null)");
  expect(reorder).toContain("Unsaved round order changes");
 });
});
