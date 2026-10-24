import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {requirePersistedMentorInboxMembership} from
  "@/modules/activity/mentor-notifications-service";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listVisibleAnnouncementsForMembershipPage} from
  "@/modules/announcements/service";
import {listOwnMentorSourceReceipts} from
  "@/modules/projects/mentor-notification-source-receipts-service";
import {mentorAnnouncementReceiptKey} from
  "@/modules/projects/mentor-attention-read-model";
export const runtime="nodejs";
const cursorSchema=z.strictObject({
 beforePinned:z.enum(["0","1"]),
 beforeCreatedAt:z.iso.datetime({offset:true}),
 beforeId:z.string().uuid(),
});
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  await requirePersistedMentorInboxMembership(context);
  if(!announcementsRuntimeEnabled())
   return NextResponse.json({error:"ANNOUNCEMENTS_UNAVAILABLE"},{status:503});
  const query=new URL(request.url).searchParams;
  const raw=Object.fromEntries(query.entries());
  if(query.size!==3||query.has("collegeId")||query.has("userId"))
   return NextResponse.json({error:"INVALID_CURSOR"},{status:400});
  const parsed=cursorSchema.parse(raw);
  const page=await listVisibleAnnouncementsForMembershipPage(
    context,new Date(),{
      isPinned:parsed.beforePinned==="1",
      createdAt:new Date(parsed.beforeCreatedAt),
      id:parsed.beforeId,
    });
  const keys=page.items.map(mentorAnnouncementReceiptKey);
  const read=await listOwnMentorSourceReceipts(context,keys);
  return NextResponse.json({
   items:page.items.map(item=>{
    const receiptKey=mentorAnnouncementReceiptKey(item);
    return {
      id:item.id,source:"ANNOUNCEMENT" as const,
      title:item.title,description:item.message,
      occurredAt:item.createdAt.toISOString(),actionHref:null,
      read:read.has(receiptKey),receiptKey,
    };
   }),
   nextCursor:page.nextCursor?{
    beforePinned:page.nextCursor.isPinned?"1":"0",
    beforeCreatedAt:page.nextCursor.createdAt.toISOString(),
    beforeId:page.nextCursor.id,
   }:null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
