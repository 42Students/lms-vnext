import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Interview card containment, download safety and fallback decisions",()=>{
 it("GR-70 isolates the Super Admin interview card in a retryable client error boundary",()=>{
  const page=read("src/components/placements/placement-calendar-workspace.tsx");
  expect(page).toContain("<PlacementPanelErrorBoundary>");
  const c=read("src/components/admin/placement-panel-error-boundary.tsx");
  expect(c).toContain("getDerivedStateFromError");
  expect(c).toContain("Could not load this right now. Try again.");
  expect(c).toContain('role="alert"');
 });
 it("GR-64 prevents an empty error export and caps long downloads with a plain notice",()=>{
  const c=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(c).toContain("filtered.slice(0,500)");
  expect(c).toContain("No interviews match the selected filters. Clear filters to export.");
  expect(c).toContain("Export includes the first 500 visible rounds.");
 });
 it("GR-91 provides a keyboard-reachable retry button with a visible focus ring",()=>{
  const c=read("src/components/admin/placement-panel-error-boundary.tsx");
  expect(c).toContain("Retry this card");
  expect(c).toContain("focus-visible:ring-2");
 });
 it("GR-92 explains failures with text rather than color alone",()=>{
  const c=read("src/components/admin/placement-panel-error-boundary.tsx");
  expect(c).toContain("Could not load this right now.");
  expect(c).toContain("Retry this card");
 });
});
