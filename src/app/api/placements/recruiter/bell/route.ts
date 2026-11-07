import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readHrRecruiterBell,markHrRecruiterBellRead,countHrRecruiterBellUnread} from "@/modules/placements/hr-recruiter-bell-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    if(new URL(request.url).searchParams.get("countOnly")==="1"){
   const count=await countHrRecruiterBellUnread(context);
   return NextResponse.json({...count,ok:true},{headers:{"Cache-Control":"private, no-store"}});
  }
    const data=await readHrRecruiterBell(context);
    return NextResponse.json({...data,ok:true,
    unreadCount:data.unread,refreshAfterMs:30_000,
    // Modern routes keep request-context college grants and event ACLs.
    links:{feed:"/api/placements/recruiter/bell",
      drawer:"/api/placements/recruiter/notifications/drawer",
      notifications:"/hr/notifications"},
   },{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const data=await markHrRecruiterBellRead(__ctx);
    return NextResponse.json({...data,ok:true},{headers:{"Cache-Control":"private, no-store"}});
  },
);
/** Legacy PUT /notifications/mark-all-read uses the same scoped writer. */
export const PUT=POST;
