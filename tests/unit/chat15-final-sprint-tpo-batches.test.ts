import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseTpoBatchFacetQuery,filterTpoBatchFacets}
 from "@/modules/placements/tpo-batch-facets-model";
import {tpoStudentNudgeInputSchema,tpoStudentNudgeLabels}
 from "@/modules/placements/tpo-student-nudge-send-model";
import {tpoBatchSavedViewCommandSchema,tpoBatchViewUrl}
 from "@/modules/placements/tpo-batch-saved-view-model";
import {tpoBatchShortcut,tpoBatchVisibleSelection,tpoBatchSelectedClipboard}
 from "@/modules/placements/tpo-batch-keyboard-actions-model";

const text=(path:string)=>readFileSync(path,"utf8");
const batch="123e4567-e89b-42d3-a456-426614174001";
const student="123e4567-e89b-42d3-a456-426614174002";

describe("chat-15 final sprint: TPO batch workflow parity and adversarial boundaries",()=>{
 it("TPO-batches-11 supports checked multiselect facets with live counts and fails closed for forged choices",()=>{
  const rows=[
   {program:"B.Tech",department:"CSE",endYear:2099,placementState:"In placements" as const},
   {program:"B.Tech",department:"ECE",endYear:2099,placementState:"Not started" as const},
   {program:"M.Tech",department:"CSE",endYear:2100,placementState:"Finished" as const},
  ];
  const parsed=parseTpoBatchFacetQuery({
   facetState:["In placements","Not started"],facetProgram:"B.Tech",facetFinalYear:"2099",
  },rows);
  expect(parsed.success).toBe(true);
  if(!parsed.success)return;
  expect(filterTpoBatchFacets(rows,parsed.data)).toHaveLength(2);
  const forged=parseTpoBatchFacetQuery({facetProgram:"Hidden College"},rows);
  expect(forged.success).toBe(false);
  const panel=text("src/components/tpo/tpo-batch-facet-filters.tsx");
  for(const label of ["Filters · State, Department, Program, Final year",
   "type=\"checkbox\"","matching batches","Clear all","Show {count}"])
   expect(panel).toContain(label);
  expect(text("src/app/(authenticated)/tpo/batches/page.tsx")).toContain("<TpoBatchFacetFilters");
 });
 it("TPO-batches-44 sends audited bounded learner nudges and offers scoped private notes",()=>{
  const message={learnerMembershipIds:[student],template:"REGISTRATION",message:"Review your choice."};
  expect(tpoStudentNudgeInputSchema.safeParse(message).success).toBe(true);
  for(const bad of [
   {...message,learnerMembershipIds:[]},
   {...message,learnerMembershipIds:[student,student]},
   {...message,learnerMembershipIds:Array.from({length:26},()=>student)},
   {...message,message:"x"},
   {...message,admin:true},
  ])expect(tpoStudentNudgeInputSchema.safeParse(bad).success).toBe(false);
  expect(Object.values(tpoStudentNudgeLabels)).toEqual([
   "Register for placements","Upload resume","Complete profile",
   "Apply to drives","Answer your offer","Write a message",
  ]);
  const nudge=text("src/components/tpo/tpo-student-nudge-panel.tsx");
  expect(nudge).toContain("useGuardedAction");
  expect(nudge).toContain("/api/placements/tpo/students/nudges");
  expect(nudge).toContain("Confirm send");
  expect(nudge).toContain("already delivered today.");
  const notes=text("src/components/tpo/tpo-batch-student-bulk-notes.tsx");
  expect(notes).toContain("<TpoStudentNoteEditor");
  expect(notes).toContain("Notes remain private to authorized placement staff.");
 });
 it("TPO-batches-46 saved views remain batch-scoped and reject malformed commands",()=>{
  const view={batchId:batch,q:"Java",decision:"ELIGIBLE",source:"ALL",
   registration:"ALL",order:"NAME_ASC"} as const;
  const valid={action:"CREATE",name:"Eligible Java",pinned:true,filters:view};
  expect(tpoBatchSavedViewCommandSchema.safeParse(valid).success).toBe(true);
  for(const bad of [
   {...valid,filters:{...view,batchId:"wrong"}},
   {...valid,name:""},
   {...valid,admin:true},
   {...valid,action:"DELETE"},
  ])expect(tpoBatchSavedViewCommandSchema.safeParse(bad).success).toBe(false);
  expect(tpoBatchViewUrl(view)).toContain("/tpo/batches/"+batch+"/students?");
  expect(tpoBatchViewUrl(view)).toContain("decision=ELIGIBLE");
  const saved=text("src/components/tpo/tpo-batch-student-saved-views.tsx");
  for(const label of ["Pin up to five views","Save current filters","Update selected","Download CSV","Delete"])
   expect(saved).toContain(label);
 });
 it("TPO-batches-65 keyboard and mobile selection only cover visible rows, not an unseen college roster",()=>{
  const shortcut={key:"a",ctrlKey:true,metaKey:false,altKey:false,
   shiftKey:false,insideEditable:false};
  expect(tpoBatchShortcut(shortcut)).toBe("SELECT_VISIBLE");
  expect(tpoBatchShortcut({...shortcut,key:"c"})).toBe("COPY_SELECTED");
  expect(tpoBatchShortcut({...shortcut,insideEditable:true})).toBeNull();
  expect(tpoBatchShortcut({...shortcut,altKey:true})).toBeNull();
  const rows=Array.from({length:30},(_,n)=>({
   id:"student-"+n,name:n===0?"A\nB":"Learner "+n,rollNumber:"R\t"+n,
  }));
  expect(tpoBatchVisibleSelection(rows,rows.map(row=>row.id))).toHaveLength(25);
  expect(tpoBatchVisibleSelection(rows,["outside","student-1","student-1"])).toEqual(["student-1"]);
  const copy=tpoBatchSelectedClipboard(rows,["student-0","outside"]);
  expect(copy).toContain("A B\tR 0");
  expect(copy).not.toContain("outside");
  const ui=text("src/components/tpo/tpo-batch-student-keyboard-actions.tsx");
  for(const label of ["md:hidden","md:flex","Copy selected","Select visible","Student actions",
   "Shortcuts never intercept an input field."])
   expect(ui).toContain(label);
 });
});
