import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorPersonalInbox} from
 "@/modules/activity/mentor-notifications-service";
import {mentorInboxQuerySchema} from
 "@/modules/activity/mentor-notifications-model";
export const runtime="nodejs";
/** Page only the authenticated recipient's personal notices. The cursor is
 * validated before DB access; the service re-verifies active Mentor role and
 * college membership on every page, never trusting client recipient IDs.
 */
export async function GET(request:Request){
 try{
  const query=new URL(request.url).searchParams;
  if([...query.keys()].some(key=>!["view","beforeCreatedAt","beforeId"].includes(key))||
    [...query.keys()].some(key=>query.getAll(key).length!==1))
    return NextResponse.json({error:"INVALID_NOTIFICATION_CURSOR"},{status:400});
  const parsed=mentorInboxQuerySchema.safeParse({
    view:query.get("view")??undefined,
    beforeCreatedAt:query.get("beforeCreatedAt")??undefined,
    beforeId:query.get("beforeId")??undefined,
  });
  if(!parsed.success)return NextResponse.json({
   error:"INVALID_NOTIFICATION_CURSOR"},{status:400});
  const result=await getMentorPersonalInbox(
    await getCurrentRequestContext(),parsed.data);
  if(result.cursor.invalid)return NextResponse.json({
   error:"INVALID_NOTIFICATION_CURSOR"},{status:400});
  return NextResponse.json({
   items:result.page.items.map(({notification})=>({
     id:notification.id,source:"PERSONAL" as const,
     title:notification.title,description:notification.body,
     occurredAt:notification.createdAt.toISOString(),
     actionHref:notification.actionHref,
     read:notification.readAt!==null,receiptKey:null,
   })),
   nextCursor:result.page.nextCursor?{
     beforeCreatedAt:result.page.nextCursor.beforeCreatedAt.toISOString(),
     beforeId:result.page.nextCursor.beforeId,
   }:null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
