import {describe,expect,it} from "vitest";
import {projectResourceFileDeclaration,validProjectResourceUploadGrant,projectFileUsable} from "@/modules/projects/project-resource-files-ui-model";
import {MAX_DOCUMENT_BYTES} from "@/modules/storage/ui-models";
describe("Project resource upload UI contract",()=>{
  it("checks size and allowed document types before requesting a grant",()=>{
    expect(projectResourceFileDeclaration({name:"notes.pdf",size:1024,type:"application/pdf"}).ok).toBe(true);
    expect(projectResourceFileDeclaration({name:"empty.pdf",size:0,type:"application/pdf"}).ok).toBe(false);
    expect(projectResourceFileDeclaration({name:"huge.pdf",size:MAX_DOCUMENT_BYTES+1,type:"application/pdf"}).ok).toBe(false);
    expect(projectResourceFileDeclaration({name:"evil.svg",size:123,type:"image/svg+xml"}).ok).toBe(false);
  });
  it("only accepts secure presigned PUT grants with documented headers",()=>{
    const grant={fileId:"file",method:"PUT",uploadUrl:"https://files.example.test/put",expiresAt:"2030-01-01T00:00:00.000Z",requiredHeaders:{"content-type":"application/pdf","x-amz-meta-upload-token":"abc"},originalName:"report.pdf"};
    expect(validProjectResourceUploadGrant(grant)).toBe(true);
    expect(validProjectResourceUploadGrant({...grant,uploadUrl:"http://files.example.test/put"})).toBe(false);
    expect(validProjectResourceUploadGrant({...grant,requiredHeaders:{Authorization:"secret"}})).toBe(false);
  });
  it("allows download only for READY files",()=>{
    expect(projectFileUsable({status:"READY"})).toBe(true);
    for(const status of ["UPLOADING","VERIFYING","FAILED","QUARANTINED","DELETED"] as const)
      expect(projectFileUsable({status})).toBe(false);
  });
});
