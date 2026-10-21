import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listProjectTaskComments,postProjectTaskComment} from "@/modules/projects/task-comment-service";
export const runtime="nodejs";
/** The nested /tasks/items/:taskId/comments alias delegates here. Comments
 * remain project-scoped UUID resources, not old unscoped numeric entities.
 * The read service omits legacyWasDeleted and deletedAt rows and preserves
 * their retention/audit metadata. No hard-delete operation is exposed.
 */
type Route={params:Promise<{projectId:string;taskId:string}>};
export async function GET(_request:Request,{params}:Route){
 try{const context=await getCurrentRequestContext();const {projectId,taskId}=await params;
 return NextResponse.json({comments:await listProjectTaskComments(context,projectId,taskId),
  message:"Project task comments retrieved"},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const context=await getCurrentRequestContext();const {projectId,taskId}=await params;
 const comment=await postProjectTaskComment(context,projectId,taskId,await request.json());
 // Keep the new 201 single-comment payload; legacy clients may read the
 // success message while new clients revalidate their paginated comment list.
 return NextResponse.json({comment,message:"Project task comment added",refreshComments:true},{status:201});
 }catch(error){return apiErrorResponse(error);}
}
