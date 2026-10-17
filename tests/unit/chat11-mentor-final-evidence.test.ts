import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("final-delivery mentor review context",()=>{
  it("MEN-projects-meetings-64 shows author, submitted time, learner notes, typed links, and all recorded version events",()=>{
    const s=source("src/components/projects/project-workspace.tsx");
    for(const name of ["Submission type","Submitted by","Submitted at","submission.notes",
      "Additional evidence","Submission history","submission.reopenedAt","submission.lockedAt"])
      expect(s).toContain(name);
    expect(s).toContain("<ProjectDeliveryEvidenceDownload");
    expect(s).toContain("typeof row.fileId");
  });
  it("MEN-projects-meetings-64 opens verified evidence through a same-origin short-lived grant",()=>{
    const s=source("src/components/projects/project-delivery-evidence-download.tsx");
    expect(s).toContain("/download-grant");
    expect(s).toContain('disposition:"attachment"');
    expect(s).toContain('credentials:"same-origin"');
    expect(s).toContain("isSafeSignedUrl(url)");
    expect(s).toContain("window.location.assign(url)");
    expect(s).not.toContain("setUrl");
    const route=source("src/app/api/projects/[projectId]/resource-files/[fileId]/download-grant/route.ts");
    expect(route).toContain("isSameOriginRequest");
    expect(route).toContain("issueProjectFileDownloadGrant");
  });
});
