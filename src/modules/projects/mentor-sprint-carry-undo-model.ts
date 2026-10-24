import {z} from "zod";

/** An exact reversible task state from one immutable sign-off transaction.
 * The receipt carries no file URLs, task descriptions or learner identities.
 * A missing or stale receipt is NOT permission to guess where a task belonged.
 */
export const mentorSprintCarryUndoReceiptSchema=z.strictObject({
 version:z.literal(1),signOffToken:z.string().uuid(),sprintId:z.string().uuid(),
 tasks:z.array(z.strictObject({
   taskId:z.string().uuid(),beforeSequence:z.number().int().nonnegative(),
   beforeCarriedFromSprintId:z.string().uuid().nullable(),
   beforeCarriedOverAt:z.iso.datetime({offset:true}).nullable(),
   afterSprintId:z.string().uuid().nullable(),
   afterSequence:z.number().int().nonnegative(),
   afterDeletedAt:z.iso.datetime({offset:true}).nullable(),
   afterUpdatedAt:z.iso.datetime({offset:true}),
   status:z.string().min(1).max(32),
 })).max(250),
});
export type MentorSprintCarryUndoReceipt=z.infer<typeof mentorSprintCarryUndoReceiptSchema>;
type CurrentTask={
 id:string;sprintId:string|null;sequence:number;deletedAt:Date|null;
 carriedFromSprintId:string|null;updatedAt:Date;status:string;
};
export function mentorSprintCanUndoCarriedTasks(
 receipt:MentorSprintCarryUndoReceipt,projectSprintId:string,
 current:readonly CurrentTask[],occupiedSourceSequences:ReadonlySet<number>,
):boolean{
 if(receipt.sprintId!==projectSprintId||current.length!==receipt.tasks.length||
    new Set(receipt.tasks.map(item=>item.taskId)).size!==receipt.tasks.length)return false;
 const taskById=new Map(current.map(item=>[item.id,item]));
 if(new Set(receipt.tasks.map(item=>item.beforeSequence)).size!==receipt.tasks.length)
   return false;
 for(const item of receipt.tasks){
   const existing=taskById.get(item.taskId);
   if(!existing||existing.sprintId!==item.afterSprintId||
      existing.sequence!==item.afterSequence||
      existing.status!==item.status||
      existing.carriedFromSprintId!==projectSprintId||
      existing.updatedAt.toISOString()!==item.afterUpdatedAt||
      (existing.deletedAt?.toISOString()??null)!==item.afterDeletedAt||
      occupiedSourceSequences.has(item.beforeSequence))return false;
 }
 return true;
}
