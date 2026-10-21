import {NextResponse} from "next/server";
import {getPublicJoinPreview} from "@/modules/placements/public-join/preview-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 try{
  const {token}=await params;
  const preview=await getPublicJoinPreview(token,"COMPANY");
  if(preview.kind!=="READY")
   return NextResponse.json({success:false,error:"NOT_FOUND"},{status:404,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({success:true,data:{
   collegeName:preview.collegeName,companyName:preview.companyName,
   companyDomain:preview.companyDomain,
  }},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({success:false,error:"SERVICE_UNAVAILABLE"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
