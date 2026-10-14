import {z} from "zod";
export const facultyQuizResultsCommandSchema=z.object({
 deliveryId:z.string().uuid(),
 action:z.enum(["PUBLISH","HIDE"]),
 expectedUpdatedAt:z.string().datetime({offset:true}),
 confirmed:z.literal(true),
}).strict();
export function facultyQuizResultsTransition(status:string,published:boolean,action:"PUBLISH"|"HIDE"){
 return status==="CLOSED"&&(action==="PUBLISH"?!published:published);
}
