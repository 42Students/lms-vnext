import {z} from "zod";
export const mentorTaskFeedbackParamsSchema=z.object({
 projectId:z.string().uuid(),taskId:z.string().uuid(),
}).strict();
export function taskFeedbackStatusLabel(status:string){
 return status==="APPROVED"?"Approved":status==="CHANGES_REQUESTED"?"Changes requested":"Reviewed";
}
