import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 final sprint",()=>{
 it("LEARNER-course-detail-07 preserves verified functionality and safe failure states",()=>{
 const page=read("src/components/courses/learner-course-workspace.tsx");
 const control=read("src/components/courses/lesson-resource-materials-control.tsx");
 const service=read("src/modules/courses/lesson-resource-materials-service.ts");
 const route=read("src/app/api/courses/lesson-contents/[contentId]/materials/route.ts");
 expect(page).toContain("<LessonResourceMaterialsControl");
 expect(page).toContain("resourceMaterialsRuntimeEnabled()");
 expect(control).toContain("Materials ({materials.length}/20)");
 expect(control).toContain("material.title");
 expect(control).toContain("material.notes");
 expect(control).toContain('material.kind==="LINK"');
 expect(service).toContain("requireLearningReadAccess");
 expect(service).toContain('content.status!=="PUBLISHED"');
 expect(service).toContain("asc(lessonContentMaterials.sequence)");
 expect(service).toContain("object keys");
 expect(route).toContain('Cache-Control":"private, no-store"');
 });
});
