import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const facultyDiscussionReplySchema=z.object({
 messageText:z.string().trim().min(1).max(3900),
 replyToMessageId:zUuid,
 expectedParentUpdatedAt:z.string().datetime({offset:true}),
 confirmed:z.literal(true),
}).strict();
export function facultyReplyParentTokenMatches(current:Date,expectedIso:string){
 const parsed=new Date(expectedIso);
 return Number.isFinite(parsed.getTime())&&current.getTime()===parsed.getTime();
}
