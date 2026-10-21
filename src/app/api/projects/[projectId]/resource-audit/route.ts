import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getProjectResourceAuditPage} from "@/modules/projects/workspace-view-service";
import {z} from "zod";

export const runtime="nodejs";
const cursorSchema=z.object({
  beforeTime:z.iso.datetime().optional(),
  beforeId:z.string().uuid().optional(),
}).strict().refine(value=>Boolean(value.beforeTime)===Boolean(value.beforeId));
export async function GET(request:Request,{params}:{
  params:Promise<{projectId:string}>;
}){
  try{
    const {projectId}=await params;
    const url=new URL(request.url);
    const parsed=cursorSchema.safeParse({
      beforeTime:url.searchParams.get("beforeTime")??undefined,
      beforeId:url.searchParams.get("beforeId")??undefined,
    });
    if(!parsed.success)return NextResponse.json({error:"INVALID_ACTIVITY_CURSOR"},{status:400});
    const cursor=parsed.data.beforeTime&&parsed.data.beforeId
      ?{beforeTime:parsed.data.beforeTime,beforeId:parsed.data.beforeId}:undefined;
    const page=await getProjectResourceAuditPage(await getCurrentRequestContext(),projectId,cursor);
    return NextResponse.json(page,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
