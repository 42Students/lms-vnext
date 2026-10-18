import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
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
  expect(html).toContain("More details");
  expect(html).not.toContain("md:block");
  expect(html).not.toContain("min-w-[46rem]");
 });
 it("keeps sorting, chooser and reset controls keyboard-focusable and 44px tall",()=>{
  const html=renderToStaticMarkup(<TpoRequestPageClipboard rows={[row]}/>);
  expect(html).toMatch(/<select[^>]*min-h-11[^>]*>/);
  expect(html).toMatch(/<summary[^>]*min-h-11[^>]*>Choose columns<\/summary>/);
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
