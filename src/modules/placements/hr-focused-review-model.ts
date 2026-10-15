import {z} from "zod";
export const focusedReviewSchema=z.object({candidateIds:z.array(z.string().uuid()).max(500),currentId:z.string().uuid()}).strict();
export function focusedReviewNavigation(input:z.infer<typeof focusedReviewSchema>){
 const {candidateIds,currentId}=focusedReviewSchema.parse(input);
 const index=candidateIds.indexOf(currentId);
 return {index,total:candidateIds.length,previous:index>0?candidateIds[index-1]:null,next:index>=0&&index<candidateIds.length-1?candidateIds[index+1]:null};
}
