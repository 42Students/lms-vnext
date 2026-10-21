import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCourseDiscussionChanges} from "@/modules/courses/discussion-service";

export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{deliveryId:string}>;
}){
 try{
  const {deliveryId}=await params;
  const url=new URL(request.url);
  const values=Object.fromEntries(url.searchParams.entries());
  const result=await listCourseDiscussionChanges(
    await getCurrentRequestContext(),deliveryId,values,
  );
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
