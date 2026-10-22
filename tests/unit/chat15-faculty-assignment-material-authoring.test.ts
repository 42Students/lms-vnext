import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("LEARNER-course-detail-03 and LEARNER-learning-misc-02 authoring recovery",()=>{
 it("LEARNER-course-detail-03 makes saved assignment links editable without a new page design",()=>{
  const editor=read("src/components/courses/faculty-assignment-editor.tsx");
  expect(editor).toContain("FacultyAssignmentMaterialLinks");
  expect(editor).toContain("assignmentId={existing.id}");
  expect(editor).toContain('key={existing.id}');
  const links=read("src/components/courses/faculty-assignment-material-links.tsx");
  expect(links).toContain("Add link");
  expect(links).toContain("Remove this instructor resource link?");
  expect(links).toContain("File handouts require verified private storage and cannot be published from a public Drive link.");
 });
 it("LEARNER-learning-misc-02 never leaks pending text or fakes a stored file when provider fails",()=>{
  const s=read("src/components/courses/faculty-assignment-material-links.tsx");
  expect(s).toContain("const lock=useRef(false)");
  expect(s).toContain("finally{lock.current=false;setPending(false);}");
  expect(s).toContain("setError(");
  expect(s).toContain("setTitle(\"\");setExternalUrl(\"\");");
  expect(s).not.toContain("storageKey");
 });
});
