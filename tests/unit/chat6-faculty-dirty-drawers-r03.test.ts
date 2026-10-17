import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("Faculty assessment draft close safety",()=>{
 it("FAC-assessments-R03 protects edited create and edit drawers, reset after save and beforeunload",()=>{
  const create=read("src/components/courses/faculty-assessment-create.tsx");
  const edit=read("src/components/courses/faculty-assessment-editor.tsx");
  const author=read("src/components/courses/faculty-lesson-authoring.tsx");
  for(const v of ["Discard this quiz draft?","Discard this assignment draft?","onInputCapture={()=>setDraftDirty(true)}","onSaved={()=>setDraftDirty(false)}"])expect(create).toContain(v);
  for(const v of ["Discard quiz changes?","window.addEventListener(\"beforeunload\"","window.removeEventListener(\"beforeunload\"","if (!next && (saving || deleting)) return;"])expect(edit).toContain(v);
  expect(author).toContain("onSaved?.();");
 });
});