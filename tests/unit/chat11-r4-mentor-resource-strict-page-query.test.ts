import {expect,it} from "vitest";
import {parseMentorResourceDirectorySearch} from "@/modules/projects/mentor-resource-directory-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("rejects unknown or repeated URL filters on the mentor resources page",()=>{
 expect(parseMentorResourceDirectorySearch(projectId,{projectId:"other"})).toBeNull();
 expect(parseMentorResourceDirectorySearch(projectId,{required:["ALL","REQUIRED"]})).toBeNull();
 expect(parseMentorResourceDirectorySearch(projectId,{search:"notes",sort:"unrecognized"})).toBeNull();
});
it("normalizes the supported fields and retains valid paging",()=>{
 expect(parseMentorResourceDirectorySearch(projectId,{search:"  design  ",required:"REQUIRED",page:"2"}))
 .toMatchObject({projectId,search:"design",required:"REQUIRED",page:2});
 expect(parseMentorResourceDirectorySearch(projectId,{})).toMatchObject({page:1,required:"ALL"});
});
