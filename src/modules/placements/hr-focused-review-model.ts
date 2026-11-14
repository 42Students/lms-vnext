import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const focusedReviewSchema=z.object({candidateIds:z.array(zUuid).max(500),currentId:zUuid}).strict();
export function focusedReviewNavigation(input:z.infer<typeof focusedReviewSchema>){
 const {candidateIds,currentId}=focusedReviewSchema.parse(input);
 const index=candidateIds.indexOf(currentId);
 return {index,total:candidateIds.length,previous:index>0?candidateIds[index-1]:null,next:index>=0&&index<candidateIds.length-1?candidateIds[index+1]:null};
}
