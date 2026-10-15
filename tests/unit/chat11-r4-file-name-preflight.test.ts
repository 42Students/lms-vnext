import {expect,it} from "vitest";
import {resourceFilePreflight} from "@/modules/projects/resource-file-preflight-model";
const limits={maxBytes:1024,maxPerResource:5,allowedContentTypes:["application/pdf"]};
it("blocks direction-control and control-character filename spoofing in upload preflight",()=>{
 for(const name of ["invoice\u202Efdp.exe","safe\u2066.pdf","bad\u007f.pdf","bad\n.pdf","folder/file.pdf","folder\\file.pdf"]){
  expect(resourceFilePreflight({name,size:200,type:"application/pdf"},limits,0).allowed).toBe(false);
 }
 expect(resourceFilePreflight({name:"Résumé 2026.pdf",size:200,type:"application/pdf"},limits,0).allowed).toBe(true);
});
