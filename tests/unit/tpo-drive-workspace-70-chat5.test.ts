import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("TPO destructive round-plan UX",()=>{
 it("TPO-drive-workspace-70 reviews current draft round replacement in an accessible dialog instead of native window.confirm",()=>{
  const src=readFileSync("src/components/placements/placement-drive-controls.tsx","utf8");
  expect(src).toContain("ConfirmDialog");
  expect(src).toContain("setPresetToReplace({label,rounds})");
  expect(src).toContain('confirmLabel="Replace draft rounds"');
  expect(src).toContain("Nothing is saved to the drive until you review and save the new plan.");
  expect(src).toContain("applyRoundPreset(presetToReplace.rounds)");
  expect(src).not.toContain("window.confirm");
 });
});
