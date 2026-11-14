import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const facultyQuizResultsCommandSchema=z.object({
 deliveryId:zUuid,
 action:z.enum(["PUBLISH","HIDE"]),
 expectedUpdatedAt:z.string().datetime({offset:true}),
 confirmed:z.literal(true),
}).strict();
export function facultyQuizResultsTransition(
 status:string,published:boolean,action:"PUBLISH"|"HIDE",
 dueAt:Date|null=null,now=new Date(),
){
 const deadlineReached=status==="PUBLISHED" && Boolean(dueAt && dueAt.getTime()<=now.getTime());
 return (status==="CLOSED"||deadlineReached) &&
   (action==="PUBLISH"?!published:published);
}
