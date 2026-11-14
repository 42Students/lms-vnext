import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listStaffNotificationSubjects} from "@/modules/activity/learner-notification-read-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const params=new URL(request.url).searchParams;
    for(const key of params.keys()){
      if(key!=="classId"&&key!=="courseId")
        return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    }
    const result=await listStaffNotificationSubjects(
      __ctx,{
        classId:params.get("classId")??undefined,
        courseId:params.get("courseId")??undefined,
      },
    );
    return privateJson(result);
  },
);
