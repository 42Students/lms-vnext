import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnNotifications } from "@/modules/activity/notification-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const params = new URL(
      request.url,
    ).searchParams;
    const unreadOnly=params.get("unreadOnly")==="true";
    const query=(params.get("query")??params.get("q")??"").trim();
    const classId=params.get("classId");
    const courseId=params.get("courseId");
    if(classId!==null&&courseId!==null)
      return NextResponse.json({status:"error",message:"Provide either classId or courseId, not both"},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if(classId!==null&&!uuid.test(classId))
      return NextResponse.json({status:"error",message:
        /^[+-]?[0-9]+$/.test(classId)&&Number(classId)<=0?"classId must be >= 1":"Choose a valid class from your workspace"},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    if(courseId!==null&&!uuid.test(courseId))
      return NextResponse.json({status:"error",message:
        /^[+-]?[0-9]+$/.test(courseId)&&Number(courseId)<=0?"courseId must be >= 1":"Choose a valid course from your workspace"},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    if(query.length>100)return NextResponse.json({error:"INVALID_QUERY",message:"Search must be 100 characters or fewer"},
      {status:400,headers:{"Cache-Control":"private, no-store"}});
    const limit =
      params.get("limit") ?? "40";
    const count=Number(limit);
    if(!/^[0-9]+$/.test(limit)||!Number.isInteger(count)||count<1||count>200)
      return NextResponse.json({status:"error",message:"limit must be >= 1"},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    const rows =
      await listOwnNotifications(
        context,
        {
          unreadOnly,
          limit:count,
          ...(query?{query}:{}),
          ...(classId?{classId}:{}),
          ...(courseId?{courseId}:{}),
        },
      );

    return NextResponse.json({
      notifications:rows,status:"success",message:"Notifications retrieved",data:rows,
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
