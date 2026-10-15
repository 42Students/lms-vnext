import {filterBatchStudentNames,filterBatchStudentDecisions,filterBatchStudentDecisionSource,filterBatchStudentRegistration,sortBatchStudentView,batchStudentViewSchema} from "./tpo-batch-student-view-model";
import type {z} from "zod";
export type TpoBatchStudentViewOptions=z.infer<typeof batchStudentViewSchema>;
export function selectTpoBatchStudentView<T extends {name:string;decision:string;ambiguous:boolean;source:string;registration:{choice:string|null}|null;membershipId:string}>(rows:readonly T[],options:TpoBatchStudentViewOptions,registrationAvailable:boolean):T[]{
 return sortBatchStudentView(filterBatchStudentRegistration(filterBatchStudentDecisionSource(filterBatchStudentDecisions(filterBatchStudentNames(rows,options.q),options.decision),options.source),options.registration,registrationAvailable),options.order);
}
