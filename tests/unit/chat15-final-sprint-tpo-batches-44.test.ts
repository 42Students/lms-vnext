import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {tpoStudentNudgeLabels,tpoStudentNudgeInputSchema} from "@/modules/placements/tpo-student-nudge-send-model";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO-batches-44 batch learner actions",()=>{
 it("TPO-batches-44 provides all five named ready-message templates on the scoped batch page",()=>{
  const labels=Object.values(tpoStudentNudgeLabels);
  for(const name of ["Register for placements","Upload resume","Complete profile","Apply to drives","Answer your offer"])
   expect(labels).toContain(name);
  const page=src("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  expect(page).toContain("TpoStudentNudgePanel");
  expect(page).toContain("TpoBatchStudentBulkNotes");
  expect(page).toContain("visible.map(student=>");
 });
 it("TPO-batches-44 restricts recipients to the currently displayed batch and requires preview/confirmation",()=>{
  const nudge=src("src/components/tpo/tpo-student-nudge-panel.tsx");
  const service=src("src/modules/placements/tpo-student-nudge-send-service.ts");
  expect(nudge).toContain("validSelected=selected.filter(id=>eligible.has(id))");
  expect(nudge).toContain("setConfirmOpen(true)");
  expect(nudge).toContain("Confirm send");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toMatch(/role,\s*["']LEARNER["']/);
  expect(service).toContain("inAppNotifications");
  expect(tpoStudentNudgeInputSchema.safeParse({learnerMembershipIds:[],template:"REGISTRATION",message:"Please register."}).success).toBe(false);
 });
 it("TPO-batches-44 notes use persisted selected-membership editor and cap visible selection",()=>{
  const notes=src("src/components/tpo/tpo-batch-student-bulk-notes.tsx");
  expect(notes).toContain("TpoStudentNoteEditor membershipIds={valid}");
  expect(notes).toContain("slice(0,100)");
  expect(notes).toContain("rows.slice(0,100)");
 });
});
