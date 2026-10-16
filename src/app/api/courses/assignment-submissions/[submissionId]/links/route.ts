import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {storageJson} from "@/lib/storage-route";
import {listAssignmentSubmissionLinks} from "@/modules/courses/assignment-submission-file-service";

export const runtime="nodejs";
export async function GET(_request:Request,{params}:{
 params:Promise<{submissionId:string}>
}){
 try{
  const context=await getCurrentRequestContext();
  const {submissionId}=await params;
  const links=await listAssignmentSubmissionLinks(context,submissionId);
  return storageJson({links});
 }catch(error){return apiErrorResponse(error);}
}
