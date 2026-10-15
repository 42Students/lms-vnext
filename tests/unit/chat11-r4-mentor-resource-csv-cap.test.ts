import {expect,it} from "vitest";
import {mentorResourceDirectoryCsv} from "@/modules/projects/mentor-resource-directory-model";
const file={id:"resource-id",title:"Guide",description:"Notes",required:false,safeUrl:null};
it("caps the generated CSV itself even when a service passes more than 200 records",()=>{
 const csv=mentorResourceDirectoryCsv(Array.from({length:205},(_,i)=>({...file,id:String(i)})),7);
 expect(csv).toContain("12 additional matching resources");
 expect(csv.split("\r\n").filter(Boolean)).toHaveLength(202);
 expect(csv).not.toContain('"204"');
});
it("never writes NaN, Infinity or negative omission counts",()=>{
 for(const value of [Number.NaN,Infinity,-5]){
  const csv=mentorResourceDirectoryCsv([file],value);
  expect(csv).not.toMatch(/NaN|Infinity|additional matching/);
 }
});
it("escapes spreadsheet-formula descriptions",()=>{
 expect(mentorResourceDirectoryCsv([{...file,description:"=HYPERLINK(\\\"https://bad.example\\\")"}],0)).not.toContain(',"=HYPERLINK');
});
