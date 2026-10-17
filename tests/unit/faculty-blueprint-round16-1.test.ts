import {expect,it} from "vitest";
import {facultyContentPatch} from "@/modules/courses/faculty-content-edit-model";
it("rejects credentials in an authored resource URL",()=>{
 const base={kind:"RESOURCE" as const,title:"Reading",notes:"",url:"https://example.org/file"};
 expect(facultyContentPatch(base)).toMatchObject({externalUrl:base.url});
 for(const url of ["https://user:secret@example.org/file","https://user@example.org/file"]){
  expect(()=>facultyContentPatch({...base,url})).toThrow("credentials");
 }
});
