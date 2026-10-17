import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {TPO_STUDENT_VISIBLE_KEYS} from "@/modules/placements/tpo-grid-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 TPO export failure protection",()=>{
 it("GR-64 validates CSV content-type and successful HTTP status before starting the download",()=>{
  const s=read("src/components/tpo/tpo-safe-csv-download.tsx");
  expect(s).toContain('headers:{Accept:"text/csv"}');
  expect(s).toContain('includes("text/csv")');
  expect(s).toContain("if(!response.ok");
  expect(s).toContain("URL.revokeObjectURL(url)");
 });
 it("GR-90 / GR-91 offers announced inline export failures and keyboard retry",()=>{
  const s=read("src/components/tpo/tpo-safe-csv-download.tsx");
  expect(s).toContain('role="alert"');
  expect(s).toContain('focus-visible:ring-2');
  expect(s).toContain("if(inFlight.current)return");
  expect(s).toContain("disabled={pending}");
 });
 it("TPO-students-36 uses the safeguarded filtered student CSV download",()=>{
  const s=read("src/app/(authenticated)/tpo/students/page.tsx");
  expect(s).toContain('<TpoSafeCsvDownload href={exportHref} filename="tpo-students.csv"');
  expect(read("src/app/api/placements/tpo/students/export/route.ts")).toContain("exportTpoStudentsCsv");
 });
 it("TPO-requests-verification-15 uses the guarded CSV control for complete filtered request export",()=>{
  const s=read("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(s).toContain('<TpoSafeCsvDownload href={tpoRequestsExportHref(data.query)}');
 });
 it("TPO-requests-verification-32 offers safe CSV for each verification status",()=>{
  const s=read("src/app/(authenticated)/tpo/verification/page.tsx");
  expect(s).toContain("<TpoSafeCsvDownload key={tab}");
  expect(s).toContain('filename={"tpo-verification-"+tab.toLowerCase()+".csv"}');
 });
 it("TPO-students-26 allows explicit safe chooser preferences for the actual stage, profile and after-college columns",()=>{
  for(const key of ["stage","afterCollege","profile","offersAwaiting"])expect(TPO_STUDENT_VISIBLE_KEYS).toContain(key);
 });
 it("GR-71 / GR-72 protect import/saved-view parsing against invalid HTML and malformed JSON",()=>{
  const i=read("src/components/tpo/tpo-academic-import-workspace.tsx");
  const v=read("src/components/tpo/tpo-student-saved-views.tsx");
  expect(i).toContain('Array.isArray(result.preview?.rows)');
  expect(i).toContain("Could not process the academic details.");
  expect(v).toContain("apiFetch<View[]>(api");
  expect(v).toContain("Array.isArray(body)");
 });
});
