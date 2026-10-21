import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {announcementApiError} from "@/lib/announcement-api-error";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listSuperAdminBroadcastColleges,publishSuperAdminCollegeBroadcast} from "@/modules/announcements/super-admin-college-broadcast-service";
import {listAnnouncementsForAdmin} from "@/modules/announcements/service";
import {parseAnnouncementAdminApiQuery} from "@/modules/announcements/admin-api-query";
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


/** Legacy broadcast picker and history read, scoped by the same authoritative
 * Super Admin/TPO-college directory as POST. Cursor pages may split a broadcast:
 * visibleCopyCount is for this page only, never an all-college reach claim. */
export async function GET(request:Request){
 if(!announcementsRuntimeEnabled())
  return NextResponse.json({error:"DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING"},{status:503});
 try{
  const params=new URL(request.url).searchParams;
  const allowed=new Set(["q","includeDeleted","beforeCreatedAt","beforeId"]);
  if([...params.keys()].some(key=>!allowed.has(key)))
   return NextResponse.json({error:"INVALID_FILTER"},{status:400});
  const parsed=parseAnnouncementAdminApiQuery(params);
  if(!parsed)return NextResponse.json({error:"INVALID_FILTER"},{status:400});
  const context=await getCurrentRequestContext();
  const [colleges,history]=await Promise.all([
   listSuperAdminBroadcastColleges(context),
   listAnnouncementsForAdmin(context,{
    ...parsed,receiverType:"COLLEGE",senderType:"SUPER_ADMIN",limit:50,
   }),
  ]);
  const groups=new Map<string,typeof history.items>();
  for(const item of history.items){
   const id=item.broadcastGroupId??item.id;
   const rows=groups.get(id)??[];
   rows.push(item);
   groups.set(id,rows);
  }
  return NextResponse.json({
   colleges,
   broadcasts:[...groups.entries()].map(([id,rows])=>({
    id,firstNoticeId:rows[0]!.id,title:rows[0]!.title,
    message:rows[0]!.message,isPinned:rows[0]!.isPinned,
    createdAt:rows[0]!.createdAt,expiresAt:rows[0]!.expiresAt,
    scheduledAt:rows[0]!.scheduledAt,visibleCopyCount:rows.length,
    recipientCollegeIdsOnPage:rows.map(row=>row.collegeId),
    editableAsGroup:rows[0]!.broadcastGroupId!==null,
   })),
   nextCursor:history.nextCursor
    ?{beforeCreatedAt:history.nextCursor.beforeCreatedAt.toISOString(),
      beforeId:history.nextCursor.beforeId}:null,
   countsArePageLimited:true,
   // Until the persisted group lifecycle is wired, no endpoint may pretend
   // a per-recipient PATCH/DELETE updates the reviewed broadcast audience.
   mutations:"USE_AUDITED_GROUP_WRITER",
  },{headers:{"cache-control":"private, no-store"}});
 }catch(error){return announcementApiError(error);}
}
