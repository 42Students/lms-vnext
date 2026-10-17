import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {tpoBatchShortcut,tpoBatchVisibleSelection,tpoBatchSelectedClipboard} from "@/modules/placements/tpo-batch-keyboard-actions-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO-batches-65 mobile and keyboard batch actions",()=>{
 it("TPO-batches-65 intercepts Ctrl/Cmd+A and C only on the focused non-editable batch region",()=>{
  const base={ctrlKey:true,metaKey:false,altKey:false,shiftKey:false,insideEditable:false};
  expect(tpoBatchShortcut({...base,key:"a"})).toBe("SELECT_VISIBLE");
  expect(tpoBatchShortcut({...base,ctrlKey:false,metaKey:true,key:"C"})).toBe("COPY_SELECTED");
  for(const key of ["a","c"]){
   expect(tpoBatchShortcut({...base,key,insideEditable:true})).toBeNull();
   expect(tpoBatchShortcut({...base,key,shiftKey:true})).toBeNull();
   expect(tpoBatchShortcut({...base,key,ctrlKey:false})).toBeNull();
  }
 });
 it("TPO-batches-65 never copies off-page learners, deduplicates selected IDs and strips tabs/newlines",()=>{
  const rows=[{id:"a",name:"One\nLearner",rollNumber:"42\t1"},{id:"b",name:"Two"}];
  expect(tpoBatchVisibleSelection(rows,["a","ghost","a","b"])).toEqual(["a","b"]);
  expect(tpoBatchSelectedClipboard(rows,["ghost"])).toBe("");
  expect(tpoBatchSelectedClipboard(rows,["a"])).toBe("One Learner\t42 1");
 });
 it("TPO-batches-65 connects page-scope selection, mobile actions and honest clipboard failure",()=>{
  const ui=source("src/components/tpo/tpo-batch-student-keyboard-actions.tsx");
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  expect(page).toContain("<TpoBatchStudentKeyboardActions");
  for(const fragment of ["tabIndex={0}","onKeyDown={keydown}","md:hidden","Ctrl/Cmd+A",
   "Ctrl/Cmd+C","navigator.clipboard.writeText","Check clipboard permission","Select all learners on this page"])
   expect(ui).toContain(fragment);
 });
});
