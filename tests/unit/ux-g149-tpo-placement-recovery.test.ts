import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (filename: string) =>
 readFileSync("src/components/placements/" + filename, "utf8");

describe("UX-G149 TPO placement recovery source contracts", () => {
 it("ignores superseded selection CSV reads before showing a preview", () => {
  const src = read("tpo-selection-import.tsx");
  expect(src).toContain("const revision=++fileRevision.current");
  expect(src).toContain("if(revision!==fileRevision.current)return");
  expect(src).toContain("if(revision===fileRevision.current)setReading(false)");
 });
 it("blocks repeat selection imports after partial or ambiguous commit", () => {
  const src = read("tpo-selection-import.tsx");
  expect(src).toContain("let count=0");
  expect(src).toContain("setNeedsRefresh(true)");
  expect(src).toContain("if(busy||reading||needsRefresh||importRef.current");
  expect(src).toContain("disabled={busy||reading||needsRefresh}");
  expect(src).toContain("Reload selection register");
  expect(src).toContain("row(s) confirmed before the error");
  expect(src).toContain("setEntries([]);setNeedsRefresh(true);router.refresh()");
  expect(src).toContain("if(!file){setReading(false);return;}");
  expect(src).toContain("Reload the selection register before importing again");
  expect(src).toContain('aria-label="Matched selection import preview, scroll for more rows" tabIndex={0}');
 });
 it("locks waitlist promotions until fresh seat availability is obtained", () => {
  const src = read("tpo-waitlist-promotion-control.tsx");
  expect((src.match(/setRequiresRefresh\(true\)/g)??[])).toHaveLength(2);
  expect(src).toContain("!preview.storageReady||requiresRefresh||inFlight.current");
  expect(src).toContain("expectedPreviewToken:preview.previewToken");
  expect(src).toContain("requiresRefresh?window.location.reload():router.refresh()");
  expect(src).toContain("Offer actions are locked until the waitlist and seat availability are reloaded.");
 });
 it("drops old recruiter lead responses when calendar slot changes", () => {
  const src = read("tpo-week-hour-calendar.tsx");
  expect(src).toContain("const revision=++leadRequestRevision.current");
  expect(src).toContain("if(revision===leadRequestRevision.current)setLeads");
  expect(src).toContain("if(revision===leadRequestRevision.current)setLoadingLeads(false)");
  expect(src).toContain("leadRequestRevision.current++");
  expect(src).toContain("keyboard, or drag it to another hour");
 });
});
