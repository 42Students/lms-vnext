import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {validateTpoBulkDebarDraft}
 from "@/modules/placements/tpo-bulk-debar-model";
import {mapTpoBulkBounded}
 from "@/modules/placements/tpo-bulk-bounded-execution";

const draft={action:"DEBAR",reason:"Repeated absence without explanation",
 untilDate:"2099-12-31",duration:"DATE",untilDrives:"1",count:200};
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO-students-06 bulk debar and lift across selected filtered roster",()=>{
 it("permits 200 selected learners and rejects 201, zero, missing reason",()=>{
  expect(validateTpoBulkDebarDraft(draft)).toEqual({ok:true,message:null});
  expect(validateTpoBulkDebarDraft({...draft,action:"LIFT",count:200})).toEqual({ok:true,message:null});
  expect(validateTpoBulkDebarDraft({...draft,count:201}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,count:0}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,reason:""}).ok).toBe(false);
 });
 it("rejects impossible dates instead of allowing JavaScript rollover and validates drive windows",()=>{
  expect(validateTpoBulkDebarDraft({...draft,untilDate:"2099-02-30"}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,untilDate:"2099-02-28"}).ok).toBe(true);
  expect(validateTpoBulkDebarDraft({...draft,untilDate:"2100-02-29"}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,duration:"DRIVES",untilDrives:"10"}).ok).toBe(true);
  expect(validateTpoBulkDebarDraft({...draft,duration:"DRIVES",untilDrives:"0"}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,duration:"MANUAL",untilDate:"",untilDrives:""}).ok).toBe(true);
 });
 it("handles 200 independent learner results using at most five concurrent mutation slots",async()=>{
  let active=0,maxActive=0;
  const ids=Array.from({length:200},(_,i)=>i);
  const results=await mapTpoBulkBounded(ids,async id=>{
   active++;
   maxActive=Math.max(maxActive,active);
   await Promise.resolve();
   active--;
   return {id,status:id%7===0?"skipped":"saved"};
  },5);
  expect(results).toHaveLength(200);
  expect(maxActive).toBe(5);
  expect(results.map(row=>row.id)).toEqual(ids);
 });
 it("TPO page includes filtered non-current-page roster before bulk debar review",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  const ui=src("src/components/tpo/tpo-students-bulk-debar.tsx");
  expect(page).toContain("(roster.total<=5000?data.exportRows??roster.items:roster.items).map(student=>");
  expect(ui).toContain("const MAX=200");
  expect(ui).toContain("mapTpoBulkBounded(picked,async(learner)");
  expect(ui).toContain("mapTpoBulkBounded(picked,async(learner):Promise<Result>");
  expect(ui).toContain("The learner was notified.");
  expect(ui).toContain("Multiple restrictions need individual review.");
  expect(ui).toContain("This restriction changed. Check the student's current record before retrying.");
 });
});
