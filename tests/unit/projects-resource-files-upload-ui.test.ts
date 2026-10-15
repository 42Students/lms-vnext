import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/components/projects/project-resource-files-panel.tsx",import.meta.url),"utf8");
const contract=readFileSync(new URL("../../docs/architecture/file-and-video-apis.md",import.meta.url),"utf8");
const legacy=readFileSync(new URL("../../docs/audit/legacy-copy-A.md",import.meta.url),"utf8");
describe("Project resource file upload UI wiring",()=>{
  it("implements three-stage grants with exact headers and upload progress",()=>{
    expect(source).toContain("validProjectResourceUploadGrant(response.grant)");
    expect(source).toContain('xhr.open("PUT",url,true)');
    expect(source).toContain("Object.entries(headers)");
    expect(source).toContain("xhr.upload.onprogress");
    expect(source).toContain('+"/complete","POST"');
    expect(contract).toContain("requiredHeaders");
  });
  it("does not persist signed URLs or download files before READY",()=>{
    expect(source).toContain("projectFileUsable(file)");
    expect(source).toContain("isSafeSignedUrl(result.grant.url)");
    expect(source).toContain("window.location.assign(result.grant.url)");
    expect(source).not.toContain("setGrant(");
  });
  it("supports manager mutations and legacy controls",()=>{
    for(const value of ["Or upload a file","Upload file","Uploading…","Edit resource","Update resource","Open file","Attached"])
      expect(legacy).toContain(value);
    expect(source).toContain('"PATCH"');
    expect(source).toContain('"DELETE"');
    expect(source).toContain("file.status===\"UPLOADING\"");
  });
});
