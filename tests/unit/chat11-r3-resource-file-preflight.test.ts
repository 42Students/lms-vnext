import {expect,it} from "vitest";
import {resourceFilePreflight} from "@/modules/projects/resource-file-preflight-model";
const limits={maxBytes:1000,maxPerResource:2,allowedContentTypes:["application/pdf"]};
const f={name:"notes.pdf",size:100,type:"application/pdf"};
it("honors a backend-supplied size/type/count policy without hardcoded buckets",()=>{
 expect(resourceFilePreflight(f,limits,1)).toEqual({allowed:true,message:null});
 expect(resourceFilePreflight({...f,size:1001},limits,1).message).toMatch(/size/);
 expect(resourceFilePreflight({...f,type:"text/html"},limits,1).message).toMatch(/type/);
 expect(resourceFilePreflight(f,limits,2).message).toMatch(/file limit/);
});
it("rejects empty, path-like or invalid files before requesting a signed upload",()=>{
 for(const file of [{...f,name:"../secret.pdf"},{...f,size:0},{...f,name:""}])
  expect(resourceFilePreflight(file,limits,0).allowed).toBe(false);
 expect(resourceFilePreflight(f,limits,-1).allowed).toBe(false);
});
