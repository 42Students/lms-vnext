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
  expect(source).toContain('actions={<Link href=');
  expect(source).toContain("Back to drive");
  expect(source).toContain("min-h-11");
  expect(source).toContain("focus-visible:outline-2");
  expect(source).toContain("<TpoDriveChangeRequests");
  expect(source).toContain("data.storageReady");
 });
});
