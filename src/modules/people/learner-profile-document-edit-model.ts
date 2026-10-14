import {z} from "zod";
import {learnerProfileDocumentSchema,type LearnerProfileDocument} from "./profile-validation";
export const learnerProfileDocumentEditInputSchema=z.object({
  document:learnerProfileDocumentSchema,expectedDocument:learnerProfileDocumentSchema,
}).strict();
export function learnerProfileChangedFields(before:LearnerProfileDocument,after:LearnerProfileDocument){
  return (Object.keys(after) as (keyof LearnerProfileDocument)[])
    .filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
}
export function learnerProfileDocumentIsStale(current:LearnerProfileDocument,expected:LearnerProfileDocument){
  return learnerProfileChangedFields(current,expected).length>0;
}
