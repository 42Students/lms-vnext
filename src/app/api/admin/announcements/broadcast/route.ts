import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {announcementApiError} from "@/lib/announcement-api-error";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {publishSuperAdminCollegeBroadcast} from "@/modules/announcements/super-admin-college-broadcast-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!announcementsRuntimeEnabled())return NextResponse.json({error:"DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING"},{status:503});
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  let raw:unknown;
  try{raw=await request.json();}catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  const result=await publishSuperAdminCollegeBroadcast(await getCurrentRequestContext(),raw);
  return NextResponse.json({result},{status:201,headers:{"cache-control":"private, no-store"}});
 }catch(error){return announcementApiError(error);}
}
