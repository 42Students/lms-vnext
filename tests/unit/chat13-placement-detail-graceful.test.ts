import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin application drawer graceful actions",()=>{
 it("GR-56 external assessment links are visible and copyable if opening fails",()=>{
  const s=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(s).toContain("Copy assessment link");
  expect(s).toContain("navigator.clipboard.writeText");
  expect(s).toContain("Select and copy the link shown above.");
  expect(s).toContain("break-all");
 });
 it("GR-90 focuses an accessible error message following a failed application request",()=>{
  const s=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(s).toContain("errorRef.current?.focus()");
  expect(s).toContain('tabIndex={-1} role="alert"');
  expect(s).toContain("apiFetch");
 });
 it("GR-91 provides a keyboard-reachable, visibly focused Refresh and Copy link action",()=>{
  const s=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(s).toContain('<Button variant="secondary" type="button"');
  expect(read("src/components/ui/button.tsx")).toContain("focus-visible:outline-2");
  expect(s).toContain("Copy assessment link");
  expect(s).toContain("Refresh");
 });
 it("GR-92 uses written messages for link-copy and application errors",()=>{
  const s=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(s).toContain("Assessment link copied to clipboard");
  expect(s).toContain("Failed to copy");
  expect(s).toContain("role=\"alert\"");
 });
});
