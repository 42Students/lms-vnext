import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listAnnouncementsForAdmin} from "@/modules/announcements/service";
import {parseSuperAdminAnnouncementParams} from "@/modules/announcements/super-admin-list-query";
import {announcementHistoryCsv} from "@/modules/announcements/admin-csv-model";
import {announcementApiError} from "@/lib/announcement-api-error";
export const runtime="nodejs";
const noStore={"cache-control":"private, no-store"};
export async function GET(request:Request){
 if(!announcementsRuntimeEnabled())return Response.json({error:"DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING"},{status:503,headers:noStore});
 const raw:Record<string,string>={};
 for(const [key,value] of new URL(request.url).searchParams){
  if(Object.hasOwn(raw,key))return Response.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
  raw[key]=value;
 }
 const input=parseSuperAdminAnnouncementParams(raw);
 if(!input)return Response.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
 try{
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
   return Response.json({error:"FORBIDDEN"},{status:403,headers:noStore});
  const page=await listAnnouncementsForAdmin(context,{
   includeDeleted:input.deleted==="1",
   q:input.q,receiverType:input.receiverType,visibility:input.visibility,pinned:input.pinned,senderType:input.senderType,
   beforeCreatedAt:input.beforeCreatedAt,beforeId:input.beforeId,limit:50,
  });
  return new Response(announcementHistoryCsv(page.items,Date.now()),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":'attachment; filename="super-admin-announcements-page.csv"',
   "cache-control":"private, no-store",
   "x-export-row-count":String(page.items.length),
  }});
 }catch(error){return announcementApiError(error);}
}
