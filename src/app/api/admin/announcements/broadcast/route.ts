import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {canAccessAnnouncements} from "@/modules/announcements/actor-status-model";
import {AnnouncementError} from "@/modules/announcements/errors";
import {deleteAnnouncement,updateAnnouncement} from "@/modules/announcements/service";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {announcementApiError} from "@/lib/announcement-api-error";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listSuperAdminBroadcastColleges,publishSuperAdminCollegeBroadcast} from "@/modules/announcements/super-admin-college-broadcast-service";
import {listAnnouncementsForAdmin} from "@/modules/announcements/service";
import {parseAnnouncementAdminApiQuery} from "@/modules/announcements/admin-api-query";
export const runtime="nodejs";

/** Source broadcast IDs are distinct from individual recipient copies.
 * The existing group writer performs one CAS-checked transaction across all
 * copies; orphaned or unlinked notices cannot be edited using this route. */
const broadcastGroupIdSchema=z.uuid();
async function scopedBroadcastCopies(context:RequestContext,groupId:string){
 if(!isSuperAdmin(context)||!canAccessAnnouncements(context.user.platformStatus))
  throw new AuthorizationError("college.manage");
 requirePermission(context,"admin-scope.select");
 const copies=await getDb().select({
  id:db10Announcements.id,organizationId:db10Announcements.organizationId,
  collegeId:db10Announcements.collegeId,receiverType:db10Announcements.receiverType,
  senderType:db10Announcements.senderType,version:db10Announcements.version,
  deletedAt:db10Announcements.deletedAt,title:db10Announcements.title,
  message:db10Announcements.message,isPinned:db10Announcements.isPinned,
  createdAt:db10Announcements.createdAt,updatedAt:db10Announcements.updatedAt,
  expiresAt:db10Announcements.expiresAt,buttonUrl:db10Announcements.buttonUrl,
  buttonLabel:db10Announcements.buttonLabel,
 }).from(db10Announcements)
  .where(eq(db10Announcements.broadcastGroupId,groupId))
  .orderBy(db10Announcements.collegeId).limit(501);
 if(!copies.length||copies.length>500||
    copies.some(copy=>copy.receiverType!=="COLLEGE"||copy.senderType!=="SUPER_ADMIN"))
  throw new AnnouncementError("ANNOUNCEMENT_NOT_FOUND");
 for(const copy of copies)
  requirePermission(context,"college.manage",{
   organizationId:copy.organizationId,collegeId:copy.collegeId,
  });
 return copies;
}
async function groupMutationInput(request:Request){
 let body:unknown;
 try{body=await request.json();}catch{return null;}
 if(!body||typeof body!=="object"||Array.isArray(body))return null;
 const {broadcastGroupId,...payload}=body as Record<string,unknown>;
 const id=broadcastGroupIdSchema.safeParse(broadcastGroupId);
 return id.success?{id:id.data,payload}:null;
}

/** PUT is the legacy edit alias; recipients cannot change during an edit. */
export async function PATCH(request:Request){
 if(!announcementsRuntimeEnabled())
  return NextResponse.json({error:"DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING"},{status:503});
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const mutation=await groupMutationInput(request);
 if(!mutation)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const copies=await scopedBroadcastCopies(context,mutation.id);
  const announcement=await updateAnnouncement(context,copies[0]!.id,mutation.payload);
  if(announcement.broadcastGroupId!==mutation.id)
   throw new AnnouncementError("STALE_AUDIENCE");
  return NextResponse.json({status:"UPDATED",actionScope:"BROADCAST_GROUP",
   broadcastGroupId:mutation.id,recipientCount:copies.length,announcement},
   {headers:{"cache-control":"private, no-store"}});
 }catch(error){return announcementApiError(error);}
}
export const PUT=PATCH;

export async function DELETE(request:Request){
 if(!announcementsRuntimeEnabled())
  return NextResponse.json({error:"DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING"},{status:503});
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const mutation=await groupMutationInput(request);
 if(!mutation)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const copies=await scopedBroadcastCopies(context,mutation.id);
  const announcement=await deleteAnnouncement(context,copies[0]!.id,mutation.payload);
  if(announcement.broadcastGroupId!==mutation.id)
   throw new AnnouncementError("STALE_AUDIENCE");
  return NextResponse.json({status:"DELETED",actionScope:"BROADCAST_GROUP",
   broadcastGroupId:mutation.id,recipientCount:copies.length},
   {headers:{"cache-control":"private, no-store"}});
 }catch(error){return announcementApiError(error);}
}


/** Preserve legacy composer field names, but never infer consent or expand an
 * audience. Reviewed target IDs and explicit publish consent remain mandatory. */
function normalizeBroadcastComposer(raw:unknown):unknown{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return raw;
 const value=raw as Record<string,unknown>;
 if(!["body","pinned","link","showUntil","audience"].some(key=>key in value))
  return raw;
 return {
  audienceMode:value["audienceMode"]??(value["audience"]==="ALL"?"ALL_COLLEGES":"SELECTED_COLLEGES"),
  collegeIds:value["collegeIds"]??[],
  reviewedCollegeIds:value["reviewedCollegeIds"],
  title:value["title"],
  message:value["message"]??value["body"],
  scheduledAt:value["scheduledAt"]??null,
  expiresAt:value["expiresAt"]??value["showUntil"]??null,
  isPinned:value["isPinned"]??value["pinned"]??false,
  buttonUrl:value["buttonUrl"]??value["link"]??null,
  buttonLabel:value["buttonLabel"],
  publishConsent:value["publishConsent"],
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
   // A multi-college send is one reviewed audience; mutations require its persisted group ID.
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
  const allowed=new Set(["q","includeDeleted","beforeCreatedAt","beforeId","broadcastGroupId"]);
  if([...params.keys()].some(key=>!allowed.has(key)))
   return NextResponse.json({error:"INVALID_FILTER"},{status:400});
  if(params.has("broadcastGroupId")){
   if([...params.keys()].some(key=>key!=="broadcastGroupId"))
    return NextResponse.json({error:"INVALID_FILTER"},{status:400});
   const id=broadcastGroupIdSchema.safeParse(params.get("broadcastGroupId"));
   if(!id.success)return NextResponse.json({error:"INVALID_FILTER"},{status:400});
   const context=await getCurrentRequestContext();
   const copies=await scopedBroadcastCopies(context,id.data);
   const first=copies[0]!;
   if(copies.some(copy=>copy.version!==first.version))
    throw new AnnouncementError("STALE_VERSION");
   return NextResponse.json({broadcast:{
    id:id.data,firstNoticeId:first.id,title:first.title,message:first.message,
    isPinned:first.isPinned,createdAt:first.createdAt,updatedAt:first.updatedAt,
    expiresAt:first.expiresAt,buttonLabel:first.buttonLabel,buttonUrl:first.buttonUrl,
    version:first.version,recipientCount:copies.length,
    recipientCollegeIds:copies.map(copy=>copy.collegeId),
    deleted:copies.every(copy=>copy.deletedAt!==null),
    editableAsGroup:true,
   }},{headers:{"cache-control":"private, no-store"}});
  }
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
   // Group PATCH/PUT/DELETE perform scoped atomic CAS only for persisted groups.
   // Legacy/unlinked single-college rows deliberately remain non-editable here.
   mutations:"PERSISTED_GROUP_CAS_ONLY",
  },{headers:{"cache-control":"private, no-store"}});
 }catch(error){return announcementApiError(error);}
}
