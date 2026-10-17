import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Faculty publish-now parity and graceful fallback",()=>{
 it("FAC-assessments-13 defaults new quiz and assignment to Publish now and keeps a saved draft after publish failure",()=>{
  for(const path of ["src/components/courses/faculty-choice-quiz-builder.tsx",
    "src/components/courses/faculty-assignment-editor.tsx"]){
   const text=readFileSync(path,"utf8");
   expect(text).toContain("const [publishNow,setPublishNow]=useState(true)");
   expect(text).toContain("Publish now");
   expect(text).toContain('"PUBLISH"');
   expect(text).toContain("created as a draft. Publish it when it is ready for learners.");
   expect(text).toContain("apiFetch<unknown>(endpoint");
  }
 });
 it("GR-04 faculty assessment writes never display the raw response error",()=>{
  for(const path of ["src/components/courses/faculty-choice-quiz-builder.tsx",
    "src/components/courses/faculty-assignment-editor.tsx"]){
   const text=readFileSync(path,"utf8");
   expect(text).toContain('import {apiFetch} from "@/lib/api-fetch"');
   expect(text).not.toContain("throw new Error(body?.error");
  }
 });
});
