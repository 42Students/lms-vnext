import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {
 TpoRequestPageClipboard,type TpoRequestClipboardRow,
} from "@/components/placements/tpo-request-page-clipboard";

const row:TpoRequestClipboardRow={
 id:"11111111-1111-4111-8111-111111111111",
 student:"Ananya IIT Dharwad",number:"IITD-42",
 kind:"Placement verification",company:"Verified employer",
 asked:"2026-10-18",status:"PENDING",decided:null,
};
describe("UX-SPILL-TPO-CLIP-02: request mobile cards retain selection and full fields",()=>{
 it("exposes candidate identity, company, request state and selectable row in accessible phone cards",()=>{
  const html=renderToStaticMarkup(<TpoRequestPageClipboard rows={[row]}/>);
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("Request spreadsheet");
  expect(html).toContain("Ananya IIT Dharwad");
  expect(html).toContain("IITD-42");
  expect(html).toContain("Verified employer");
  expect(html).toContain("Placement verification");
  expect(html).toContain("Select request from Ananya IIT Dharwad");
  expect(html).toContain("Select all request rows");
  expect(html).toContain("Select visible page");
  expect(html).toContain("Copy selected rows");
  // Server rendering cannot measure overflow. The shared scroll cue only
  // exposes a labelled, keyboard-focusable region after real overflow exists.
  // Keep the source contract and assert the non-interactive initial markup.
  const table=readFileSync("src/components/ui/data-table.tsx","utf8");
  const scrollCue=readFileSync("src/components/ui/scroll-cue.tsx","utf8");
  expect(table).toContain('caption+" scrollable columns"');
  expect(html).toContain('data-slot="scroll-cue"');
  expect(html).toContain('data-axis="x"');
  expect(scrollCue).toContain('role={edges.scrollable ? "region" : undefined}');
  expect(scrollCue).toContain('aria-label={edges.scrollable ? label : undefined}');
  expect(scrollCue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
  expect(html).toContain("min-w-[860px]");
  expect(html).not.toContain("md:block");
  expect(html).not.toContain("min-w-[46rem]");
 });
 it("keeps sorting, chooser and reset controls keyboard-focusable and 44px tall",()=>{
  const html=renderToStaticMarkup(<TpoRequestPageClipboard rows={[row]}/>);
  expect(html).toMatch(/<select[^>]*min-h-11[^>]*>/);
  expect(html).toMatch(/<summary[^>]*style="min-height:44px"[^>]*>Choose columns/);
  expect(html).toContain("Reset columns");
  expect(html).toMatch(/class="[^"]*min-h-11[^"]*"[^>]*>Reset columns<\/button>/);
  expect(html).toContain("focus-visible:outline-2");
 });
 it("empty authorized page has no phantom request actions and no exportable selection",()=>{
  const html=renderToStaticMarkup(<TpoRequestPageClipboard rows={[]}/>);
  expect(html).toContain("No requests on this page.");
  expect(html).toContain("0 selected of 0 on this page.");
  expect(html).toContain("Copy selected rows");
  expect(html).toContain("disabled");
  expect(html).not.toContain("Select request from ");
 });
});
