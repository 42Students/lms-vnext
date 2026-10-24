import {describe,it,expect} from "vitest";
import {canManageProjectFilePanel as manage,canUploadProjectFilePanel as upload}
 from "@/modules/projects/mentor-file-panel-role-model";
const open={mode:"MENTOR" as const,status:"ACTIVE",readOnly:false,hasMembership:true};
describe("private resource file panel role controls",()=>{
 it("hides mutation controls from guide and read-only Mentor",()=>{
  expect(manage(open)).toBe(true);
  expect(upload(open)).toBe(true);
  expect(manage({...open,readOnly:true})).toBe(false);
  expect(upload({...open,readOnly:true})).toBe(false);
  expect(upload({...open,hasMembership:false})).toBe(false);
 });
 it("never enables file upload for archived/completed projects or learner guide",()=>{
  for(const status of ["ARCHIVED","COMPLETED"]){
   expect(manage({...open,status})).toBe(false);
   expect(upload({...open,status})).toBe(false);
  }
  const learner={...open,mode:"LEARNER" as const};
  expect(manage(learner)).toBe(false);
  expect(upload(learner)).toBe(true);
  expect(upload({...learner,readOnly:true})).toBe(false);
 });
});
