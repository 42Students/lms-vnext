import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("UX-recruiter-drives-jobId-change-requests-01",()=>{
 it("preserves role-safe navigation, exact route copy and accessible shared surface",()=>{
  const source=read("src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx");
  expect(source).toContain("getDriveChangeRequests(context,jobId)");
  expect(source).toContain('data.party!=="COMPANY"');
  expect(source).toContain("<PageHeader");
  expect(source).toContain('actions={<PageBackLink href=');
  expect(source).toContain("Back to drive");
  const backLink=read("src/components/ui/page-back-link.tsx");
  expect(backLink).toContain("h-11 min-w-11");
  expect(backLink).toContain("focus-visible:outline-2");
  expect(backLink).toContain('aria-label={label}');
  expect(source).toContain("<TpoDriveChangeRequests");
  expect(source).toContain("data.storageReady");
  expect(read("src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading.tsx")).toContain("GracefulPageLoading");
  expect(read("src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error.tsx")).toContain("GracefulErrorBoundary");

 });
});
