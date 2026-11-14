import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const mentorTaskFeedbackParamsSchema=z.object({
 projectId:zUuid,taskId:zUuid,
}).strict();
export function taskFeedbackStatusLabel(status:string){
 return status==="APPROVED"?"Approved":status==="CHANGES_REQUESTED"?"Changes requested":"Reviewed";
}
