import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/modules/identity/context";
import { hasAmbiguousQuerySelectors } from "@/lib/security-query-selectors";
import { countOwnUnreadNotifications,listOwnNotifications } from "@/modules/activity/notification-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "activity.read" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const params = new URL(
      request.url,
    ).searchParams;
    if (hasAmbiguousQuerySelectors(params, [
      "view", "unreadOnly", "query", "q", "classId", "courseId", "limit",
    ], [["query", "q"]], ["view", "unreadOnly", "classId", "courseId", "limit"]))
      return NextResponse.json({ error: "INVALID_NOTIFICATION_QUERY" }, {
        status: 400, headers: { "Cache-Control": "private, no-store" },
      });
    const view=params.get("view");
    if(view!==null&&!["search","stats"].includes(view))
      return NextResponse.json({error:"INVALID_NOTIFICATION_VIEW"},{
        status:400,headers:{"Cache-Control":"private, no-store"},
      });
    if(view==="stats"){
      const unread=await countOwnUnreadNotifications(context);
      return NextResponse.json({status:"success",message:"Stats retrieved",data:{
        unread,scope:"OWN_NOTIFICATIONS_ONLY",
      }},{headers:{"Cache-Control":"private, no-store"}});
    }
    const unreadOnlyValue=params.get("unreadOnly");
    if (unreadOnlyValue!==null && unreadOnlyValue!=="true" && unreadOnlyValue!=="false")
      return NextResponse.json({ error: "INVALID_NOTIFICATION_QUERY" }, {
        status: 400, headers: { "Cache-Control": "private, no-store" },
      });
    const unreadOnly=unreadOnlyValue==="true";
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
      params.get("limit") ?? (view==="search"?"15":"40");
    const count=Number(limit);
    if(!/^[0-9]+$/.test(limit)||!Number.isSafeInteger(count)||count<1||count>100)
      return NextResponse.json({status:"error",
        message:"limit must be between 1 and 100; historical cache discovery allowed 200, but live recipient search is capped at 100"},
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
  },
);

/** Legacy POST /search/notifications/refresh has no vNext write-equivalent:
 * the scoped inbox is read directly from committed DB rows, not a mutable
 * cross-tenant cache. Do not grant refresh rights or invent "Cache refreshed".
 */
export const POST = route(
  { auth: "user", permission: "activity.read" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const params=new URL(request.url).searchParams;
    if (hasAmbiguousQuerySelectors(params, ["view"], [], ["view"]))
   return NextResponse.json({error:"INVALID_NOTIFICATION_QUERY"},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
    const view=params.get("view");
    if(view!=="refresh")return NextResponse.json({error:"METHOD_NOT_ALLOWED"},{status:405});
    if(!isSuperAdmin(context))
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
    return NextResponse.json({
   error:"NOTIFICATION_SEARCH_CACHE_RETIRED",
   message:"Notification search is live and scoped to each recipient. There is no cache to refresh.",
   refreshed:false,
  },{status:410,headers:{"Cache-Control":"private, no-store"}});
  },
);
