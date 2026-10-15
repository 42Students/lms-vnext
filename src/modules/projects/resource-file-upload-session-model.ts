import {z} from "zod";
const uuid=z.string().uuid();
export type ProjectResourceUploadAttempt={projectId:string;resourceId:string;attemptId:string;selectedName:string};
export function newResourceUploadAttempt(raw:unknown):ProjectResourceUploadAttempt{
 return z.object({
  projectId:uuid,resourceId:uuid,attemptId:uuid,selectedName:z.string().trim().min(1).max(255),
 }).strict().parse(raw);
}
/** Only the active attempt may change a file row; late callbacks are ignored. */
export function acceptsResourceUploadCallback(
 active:ProjectResourceUploadAttempt|null,
 callback:{projectId:string;resourceId:string;attemptId:string},
):boolean {
 return active!==null&&active.projectId===callback.projectId&&
 active.resourceId===callback.resourceId&&active.attemptId===callback.attemptId;
}
