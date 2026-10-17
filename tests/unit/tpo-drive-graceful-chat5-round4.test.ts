import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");
describe("Drive action resilience and accessibility",()=>{
 it("TPO-drive-workspace-70 and GR-35 require an explicit reviewed destructive-action confirmation",()=>{
  const cancel=source("src/components/placements/tpo-drive-cancel-form.tsx");
  const lifecycle=source("src/components/placements/tpo-drive-lifecycle-controls.tsx");
  expect(cancel).not.toContain("window.confirm");
  expect(lifecycle).not.toContain("window.confirm");
  expect(cancel).toContain("if (pending || !reviewed) return");
  expect(cancel).toContain("disabled={pending || !reviewed}");
  expect(lifecycle).toContain("|| !acknowledged");
  expect(cancel).toContain('type="checkbox"');
  expect(lifecycle).toContain('type="checkbox"');
 });
 it("GR-31 ignores repeated submits while the previous drive mutation is active",()=>{
  const cancel=source("src/components/placements/tpo-drive-cancel-form.tsx");
  const lifecycle=source("src/components/placements/tpo-drive-lifecycle-controls.tsx");
  expect(cancel).toContain("if (pending || !reviewed) return");
  expect(lifecycle).toContain("pending || !acknowledged");
  expect(cancel).toContain("finally");
  expect(lifecycle).toContain("finally");
 });
 it("GR-90 and GR-91 expose persistent alert copy and a keyboard confirmation control",()=>{
  const cancel=source("src/components/placements/tpo-drive-cancel-form.tsx");
  const lifecycle=source("src/components/placements/tpo-drive-lifecycle-controls.tsx");
  expect(cancel).toContain('role="alert"');
  expect(lifecycle).toContain('role="alert"');
  expect(cancel).toContain("checked={reviewed}");
  expect(lifecycle).toContain("checked={acknowledged}");
 });
});
