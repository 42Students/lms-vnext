import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {postMentorProjectUpdate} from "@/modules/projects/mentor-project-update-service";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{projectId:string}>;
}){
  try{
    const {projectId}=await params;
    // Bound request size before parsing; the validated message limit is 1000.
    const raw=await request.text();
    if(raw.length>4096)return NextResponse.json({error:"UPDATE_TOO_LONG"},{status:413});
    const body:unknown=JSON.parse(raw);
    const posted=await postMentorProjectUpdate(await getCurrentRequestContext(),projectId,body);
    return NextResponse.json({id:posted.id,message:"Project update posted"},{status:201,
      headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    return apiErrorResponse(error);
  }
}
