import {describe,expect,it} from "vitest";
import {mentorResourceDirectory,mentorResourceDirectoryCsv,
 mentorResourceDirectoryQuerySchema,safeHttpsResourceUrl}
 from "@/modules/projects/mentor-resource-directory-model";
const projectId="00000000-0000-4000-8000-000000000001";
const q=mentorResourceDirectoryQuerySchema.parse({projectId});
describe("Mentor link-resource directory",()=>{
 it("shows only safe HTTPS links and required metadata",()=>{
  const data=mentorResourceDirectory([
   {id:"a",title:"=spreadsheet",description:"Reference",url:"https://example.org/docs",
    required:true,sequence:1},
   {id:"b",title:"Bad",description:null,url:"javascript:alert(1)",
    required:false,sequence:2},
  ],{...q,required:"REQUIRED"});
  expect(data).toMatchObject({registered:2,requiredCount:1,linkableCount:1,
   total:1});
  expect(data.items[0]?.safeUrl).toBe("https://example.org/docs");
  expect(mentorResourceDirectoryCsv(data.exportItems,0)).toContain("'=spreadsheet");
  expect(safeHttpsResourceUrl("http://example.org")).toBeNull();
  expect(safeHttpsResourceUrl("https://person:secret@example.org")).toBeNull();
 });
 it("caps CSV and rejects forged tenant queries",()=>{
  const rows=Array.from({length:202},(_,i)=>({
   id:String(i),title:"Resource "+i,description:null,url:null,
   required:true,sequence:i,
  }));
  const result=mentorResourceDirectory(rows,q);
  expect(result.exportItems).toHaveLength(200);
  const ordered=mentorResourceDirectory([
   {id:"a",title:"Zulu",description:null,url:null,required:false,sequence:0},
   {id:"b",title:"Alpha",description:null,url:null,required:false,sequence:1},
  ],{...q,order:"TITLE"});
  expect(ordered.items.map(row=>row.id)).toEqual(["b","a"]);
  expect(ordered.exportItems.map(row=>row.id)).toEqual(["b","a"]);
  expect(mentorResourceDirectoryQuerySchema.safeParse({projectId,order:"UNTRUSTED"}).success)
   .toBe(false);
  expect(result.exportOmitted).toBe(2);
  expect(mentorResourceDirectoryCsv(result.exportItems,2))
   .toContain("2 additional matching resources");
  expect(mentorResourceDirectoryQuerySchema.safeParse({...q,collegeId:projectId}).success)
   .toBe(false);
 });
});
