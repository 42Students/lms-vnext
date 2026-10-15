import {expect,it} from "vitest";
import {facultyContentPatch} from "@/modules/courses/faculty-content-edit-model";
it("accepts canonical integer seconds but not exponent or decimal notation",()=>{
 const base={kind:"YOUTUBE" as const,title:"Video",notes:"",url:"https://youtu.be/abc",duration:"300"};
 expect(facultyContentPatch(base)).toHaveProperty("durationSeconds",300);
 for(const duration of ["1e2","1.5"," 20 ","020","0","86401"]){
  expect(()=>facultyContentPatch({...base,duration})).toThrow("Duration");
 }
});
