import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("legacy batch invitation flow",()=>{
 it("TPO-batches-R06 removes obsolete manual drafts from the live invitation flow",()=>{
  const base="src/app/(authenticated)/tpo/batches/[batchId]/";
  const overview=read(base+"page.tsx"),students=read(base+"students/page.tsx");
  const action=read("src/modules/placements/tpo-batch-next-action-model.ts");
  expect(overview).toContain('id="batch-invite"');
  expect(action).toContain('return "#batch-invite"');
  expect(action).not.toContain('"/reminder-prep"');
  for(const copy of ["Prepare invitation draft","Prepare registration reminder","Registration choices come from DB08 records"])
   expect(overview).not.toContain(copy);
  expect(students).not.toContain("Prepare follow-up for unrecorded choices");
  for(const legacy of ["invitation-prep","reminder-prep","nudge-prep"]){
   const source=read(base+legacy+"/page.tsx");
   expect(source).toContain("redirect(");
   expect(source).not.toContain("Manual draft only");
  }
 });
});
