import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultyContentPatch,facultyContentSaveReceiptMatches} from "../../src/modules/courses/faculty-content-edit-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Faculty content points persistence",()=>{
 it("FAC-courses-19 validates persisted points on video resources and live classes",()=>{
   const schema=read("src/db/schema/courses.ts");
   const validation=read("src/modules/courses/validation.ts");
   const service=read("src/modules/courses/lesson-content-service.ts");
   expect(schema).toContain('points: integer("points").notNull().default(1)');
   expect(schema).toContain("lesson_contents_points_ck");
   expect(validation).toContain("points: z.number().int().min(0).max(1000).default(1)");
   expect(service).toContain("points: normalized.points");
   expect(read("src/components/courses/faculty-lesson-authoring.tsx")).toContain("points: contentPointValue");
   expect(read("src/components/courses/faculty-lesson-video-manager.tsx")).toContain("contentType:\"VIDEO\",storageKey:key,durationSeconds:video.durationSeconds,points");
 });
 it("FAC-courses-19 verifies the edited points save receipt and rejects invalid values",()=>{
   const input={kind:"VIDEO" as const,title:"Clip",notes:"",url:"",points:"7"};
   const patch=facultyContentPatch(input);
   expect(patch).toMatchObject({title:"Clip",points:7});
   expect(facultyContentSaveReceiptMatches("id",patch,{content:{id:"id",title:"Clip",notes:null,points:7}})).toBe(true);
   expect(facultyContentSaveReceiptMatches("id",patch,{content:{id:"id",title:"Clip",notes:null,points:1}})).toBe(false);
   expect(()=>facultyContentPatch({...input,points:"-1"})).toThrow("Points");
   expect(()=>facultyContentPatch({...input,points:"1.5"})).toThrow("Points");
   expect(read("src/components/courses/faculty-content-editor.tsx")).toContain("Points");
 });
});
