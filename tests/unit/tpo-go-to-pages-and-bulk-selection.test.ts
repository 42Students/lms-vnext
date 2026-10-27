import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoGoToTerm,tpoGoToPageMatches,TPO_GO_TO_PAGES} from "@/components/shell/topbar/tpo-go-to-pages-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("legacy TPO go-to page command in the authenticated topbar",()=>{
 it("only activates after explicit go to, accepting spacing and case",()=>{
  expect(tpoGoToTerm("find calendar")).toBeNull();
  expect(tpoGoToTerm("goto calendar")).toBeNull();
  expect(tpoGoToTerm("Go To Calendar")).toBe("calendar");
  expect(tpoGoToTerm("go    to   requests")).toBe("requests");
  expect(tpoGoToTerm("go to")).toBe("");
 });
 it("finds only known canonical TPO routes without using raw text as an href",()=>{
  expect(tpoGoToPageMatches("go to calendar")).toEqual([{label:"Calendar",href:"/tpo/calendar"}]);
  expect(tpoGoToPageMatches("go to drives")).toEqual([{label:"Drives",href:"/tpo/placements"}]);
  expect(tpoGoToPageMatches("go to recruitment")).toEqual([]);
  expect(tpoGoToPageMatches("search recruiters")).toEqual([]);
  expect(TPO_GO_TO_PAGES.length).toBeGreaterThanOrEqual(16);
  for(const page of TPO_GO_TO_PAGES)expect(page.href).toMatch(/^\/tpo\/[a-z/-]+$/);
 });
 it("Enter resolves page mode before person search; live record fetch is suppressed",()=>{
  const top=src("src/components/shell/topbar/command-search.tsx");
  const submit=top.slice(top.indexOf("  function submit()"),top.indexOf("  function courseResult("));
  expect(submit.indexOf("if(goToMode)")).toBeGreaterThanOrEqual(0);
  expect(submit.indexOf("if(goToMode)")).toBeLessThan(submit.indexOf("if((config.portal"));
  expect(submit).toContain("goToPages[0].href");
  expect(top).toContain("query.trim().length >= 2 && !goToMode");
  expect(top).toContain('aria-label="TPO go to pages"');
  expect(top).toContain("No matching TPO page.");
 });
 it("prunes page-invisible bulk request IDs rather than trapping a stale selection",()=>{
  const bulk=src("src/components/placements/tpo-general-requests-bulk-decision.tsx");
  expect(bulk).toContain("const currentIds=new Set(rows.map(row=>row.id))");
  expect(bulk).toContain("previous.filter(id=>currentIds.has(id))");
  expect(bulk).toContain("},[rows]);");
 });
});
