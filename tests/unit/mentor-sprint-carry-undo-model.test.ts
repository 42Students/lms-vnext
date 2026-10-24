import {describe,it,expect} from "vitest";
import {mentorSprintCanUndoCarriedTasks,mentorSprintCarryUndoReceiptSchema}
  from "@/modules/projects/mentor-sprint-carry-undo-model";
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222",
 S="33333333-3333-4333-8333-333333333333",T="44444444-4444-4444-8444-444444444444";
const instant="2026-10-24T12:00:00.000Z";
const draft={version:1,signOffToken:S,sprintId:A,tasks:[{
 taskId:B,beforeSequence:2,beforeCarriedFromSprintId:null,
 beforeCarriedOverAt:null,afterSprintId:T,afterSequence:3,
 afterDeletedAt:null,afterUpdatedAt:instant,status:"TODO",
}]};
const receipt=mentorSprintCarryUndoReceiptSchema.parse(draft);
const task={id:B,sprintId:T,sequence:3,deletedAt:null,
 carriedFromSprintId:A,updatedAt:new Date(instant),status:"TODO"};
describe("Mentor Sprint sign-off compensating carry",()=>{
 it("accepts only exact, untouched carried task snapshots",()=>{
  expect(mentorSprintCanUndoCarriedTasks(receipt,A,[task],new Set())).toBe(true);
  expect(mentorSprintCanUndoCarriedTasks(receipt,A,[{...task,updatedAt:new Date(
   "2026-10-24T12:00:01.000Z")}],new Set())).toBe(false);
  expect(mentorSprintCanUndoCarriedTasks(receipt,A,[{...task,sprintId:null}],new Set())).toBe(false);
  expect(mentorSprintCanUndoCarriedTasks(receipt,A,[task],new Set([2]))).toBe(false);
 });
 it("restores archived DROP only if recorded deletion still matches",()=>{
  const dropped=mentorSprintCarryUndoReceiptSchema.parse({...draft,tasks:[{
   ...draft.tasks[0],afterSprintId:null,afterDeletedAt:instant,afterSequence:2,
  }]});
  expect(mentorSprintCanUndoCarriedTasks(dropped,A,[{
   ...task,sprintId:null,sequence:2,deletedAt:new Date(instant),
  }],new Set())).toBe(true);
  expect(mentorSprintCanUndoCarriedTasks(dropped,A,[{
   ...task,sprintId:null,sequence:2,deletedAt:null,
  }],new Set())).toBe(false);
 });
 it("rejects forged or duplicated carry receipts",()=>{
  expect(mentorSprintCarryUndoReceiptSchema.safeParse({...draft,
   tasks:[draft.tasks[0],draft.tasks[0]],
  }).success).toBe(true);
  const duplicate=mentorSprintCarryUndoReceiptSchema.parse({...draft,
   tasks:[draft.tasks[0],draft.tasks[0]],
  });
  expect(mentorSprintCanUndoCarriedTasks(duplicate,A,[task,task],new Set())).toBe(false);
  expect(mentorSprintCarryUndoReceiptSchema.safeParse({...draft,
   signOffToken:"not-a-uuid",
  }).success).toBe(false);
 });
});
