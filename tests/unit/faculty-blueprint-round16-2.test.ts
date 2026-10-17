import {expect,it} from "vitest";
import {facultyContentPatch} from "@/modules/courses/faculty-content-edit-model";
it("rejects loopback hosts and localhost aliases in Faculty Blueprint links",()=>{
 const base={kind:"RESOURCE" as const,title:"Reading",notes:"",url:"https://example.org/file"};
 for(const url of ["https://localhost/file","https://preview.localhost/file","https://127.0.0.1/file","https://[::1]/file"]){
  expect(()=>facultyContentPatch({...base,url})).toThrow("publicly reachable");
 }
 expect(facultyContentPatch(base)).toMatchObject({externalUrl:base.url});
});
