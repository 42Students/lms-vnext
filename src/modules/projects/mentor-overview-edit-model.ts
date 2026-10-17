import {z} from "zod";
const note=(max:number)=>z.string().trim().max(max).nullable();
export const mentorOverviewEditSchema=z.strictObject({
 summary:note(4000),dueLabel:note(160),blocker:note(4000),nextAction:note(4000),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
