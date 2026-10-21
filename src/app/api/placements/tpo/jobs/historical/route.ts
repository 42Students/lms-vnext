import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoHistoricalJobVisibility} from "@/modules/placements/legacy-job-visibility-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const p=new URL(request.url).searchParams;
  const raw:Record<string,string>={};
  for(const [key,value] of p){
   if(Object.hasOwn(raw,key))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   raw[key]=value;
  }
  const result=await listTpoHistoricalJobVisibility(await getCurrentRequestContext(),raw);
  return NextResponse.json(result,{headers:{"cache-control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
