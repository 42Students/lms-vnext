import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {announcementApiError} from "@/lib/announcement-api-error";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {publishSuperAdminCollegeBroadcast} from "@/modules/announcements/super-admin-college-broadcast-service";
export const runtime="nodejs";

/** Preserve legacy composer field names, but never infer consent or expand an
 * audience. Reviewed target IDs and explicit publish consent remain mandatory. */
function normalizeBroadcastComposer(raw:unknown):unknown{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return raw;
 const value=raw as Record<string,unknown>;
 if(!["body","pinned","link","showUntil","audience"].some(key=>key in value))
  return raw;
 return {
  audienceMode:value.audienceMode??(value.audience==="ALL"?"ALL_COLLEGES":"SELECTED_COLLEGES"),
  collegeIds:value.collegeIds??[],
  reviewedCollegeIds:value.reviewedCollegeIds,
  title:value.title,
  message:value.message??value.body,
  scheduledAt:value.scheduledAt??null,
  expiresAt:value.expiresAt??value.showUntil??null,
  isPinned:value.isPinned??value.pinned??false,
  buttonUrl:value.buttonUrl??value.link??null,
  buttonLabel:value.buttonLabel,
  publishConsent:value.publishConsent,
 };
}
export async function POST(request:Request){
 if(!announcementsRuntimeEnabled())return NextResponse.json({error:"DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING"},{status:503});
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  let raw:unknown;
  try{raw=await request.json();}catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  const result=await publishSuperAdminCollegeBroadcast(
   await getCurrentRequestContext(),normalizeBroadcastComposer(raw));
  return NextResponse.json({status:"CREATED",result,
   broadcastGroupId:result.broadcastGroupId,
   // A multi-college send is one immutable group, not a per-college PUT/DELETE.
   actionScope:"COLLEGE_BROADCAST",count:result.count,
  },{status:201,headers:{"cache-control":"private, no-store"}});
 }catch(error){return announcementApiError(error);}
}
