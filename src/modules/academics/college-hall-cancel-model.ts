import {z} from "zod";
export const collegeHallCancelSchema=z.strictObject({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  reason:z.string().trim().min(3).max(500),
  confirm:z.literal(true),
});
export function hallCancellationPrompt(title:string){
  return `Cancel scheduled session "${title}"? Linked attendance or course evidence blocks cancellation. This change is audited.`;
}
