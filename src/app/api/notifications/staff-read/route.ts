import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listStaffNotificationSubjects} from "@/modules/activity/learner-notification-read-service";

export const runtime="nodejs";
export async function GET(request:Request){
  try{
    const params=new URL(request.url).searchParams;
    for(const key of params.keys()){
      if(key!=="classId"&&key!=="courseId")
        return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    }
    const result=await listStaffNotificationSubjects(
      await getCurrentRequestContext(),{
        classId:params.get("classId")??undefined,
        courseId:params.get("courseId")??undefined,
      },
    );
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
